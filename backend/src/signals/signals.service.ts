import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Signal, SignalType, RiskLevel } from './entities/signal.entity';
import { AiService } from '../ai/ai.service';
import { WalletsService } from '../wallets/wallets.service';
import { MevService } from '../mev/mev.service';

@Injectable()
export class SignalsService implements OnModuleInit {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    @InjectRepository(Signal) private signalRepo: Repository<Signal>,
    private aiService: AiService,
    private walletsService: WalletsService,
    private mevService: MevService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    setTimeout(() => this.generateSignals(), 12000);
  }

  @Cron('*/60 * * * * *') // Every minute
  async generateSignals() {
    try {
      const recentWalletEvents = await this.walletsService.getRecentEvents(undefined, 20);
      const recentMevEvents = await this.mevService.getRecentEvents(10);

      const generated = await this.aiService.generateSignal(recentWalletEvents, recentMevEvents);

      const signal = await this.signalRepo.save({
        type: generated.signal_type,
        confidence: generated.confidence,
        riskLevel: generated.risk_level,
        explanation: generated.explanation,
        action: generated.action,
        evidence: { walletEvents: recentWalletEvents.length, mevEvents: recentMevEvents.length },
      });

      this.eventEmitter.emit('signal.generated', signal);
      this.logger.log(`Generated signal: ${signal.type} (confidence: ${signal.confidence}%)`);

      return signal;
    } catch (err) {
      this.logger.error(`Signal generation failed: ${err.message}`);
    }
  }

  async findAll(limit = 50): Promise<Signal[]> {
    return this.signalRepo.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findById(id: string): Promise<Signal | null> {
    return this.signalRepo.findOne({ where: { id } });
  }

  async findByType(type: SignalType, limit = 20): Promise<Signal[]> {
    return this.signalRepo.find({
      where: { type },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findHighRisk(limit = 10): Promise<Signal[]> {
    return this.signalRepo
      .createQueryBuilder('signal')
      .where('signal.riskLevel IN (:...levels)', { levels: [RiskLevel.HIGH, RiskLevel.CRITICAL] })
      .andWhere('signal.confidence > :minConf', { minConf: 70 })
      .orderBy('signal.timestamp', 'DESC')
      .take(limit)
      .getMany();
  }

  async updateOnChainHash(id: string, txHash: string): Promise<void> {
    await this.signalRepo.update({ id }, { onChainTxHash: txHash });
  }

  async markTelegramSent(id: string): Promise<void> {
    await this.signalRepo.update({ id }, { telegramSent: true });
  }

  async getSignalStats() {
    const total = await this.signalRepo.count();
    const last24h = await this.signalRepo
      .createQueryBuilder('s')
      .where('s.timestamp > :date', { date: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .getCount();

    const byType = await this.signalRepo
      .createQueryBuilder('s')
      .select('s.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.type')
      .getRawMany();

    const avgConfidence = await this.signalRepo
      .createQueryBuilder('s')
      .select('AVG(s.confidence)', 'avg')
      .getRawOne();

    return { total, last24h, byType, avgConfidence: parseFloat(avgConfidence?.avg || '0') };
  }
}
