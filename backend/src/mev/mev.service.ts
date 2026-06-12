import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MevEvent, MevAttackType, MevRiskLevel } from './entities/mev-event.entity';

@Injectable()
export class MevService {
  private readonly logger = new Logger(MevService.name);

  constructor(
    @InjectRepository(MevEvent) private mevRepo: Repository<MevEvent>,
    private eventEmitter: EventEmitter2,
  ) {}

  async recordMevEvent(data: Partial<MevEvent>): Promise<MevEvent> {
    const event = await this.mevRepo.save(data);
    this.eventEmitter.emit('mev.event.detected', event);
    this.logger.log(`MEV event: ${event.attackType} on ${event.pool} (risk: ${event.riskLevel})`);
    return event;
  }

  async getRecentEvents(limit = 50): Promise<MevEvent[]> {
    return this.mevRepo.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getEventsByPool(pool: string, limit = 20): Promise<MevEvent[]> {
    return this.mevRepo.find({
      where: { pool },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getPoolRiskScores(): Promise<Record<string, { riskScore: number; attackCount: number; riskLevel: string }>> {
    const recentEvents = await this.mevRepo
      .createQueryBuilder('mev')
      .where('mev.timestamp > :date', { date: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .getMany();

    const poolMap: Record<string, MevEvent[]> = {};
    for (const event of recentEvents) {
      if (!event.pool) continue;
      if (!poolMap[event.pool]) poolMap[event.pool] = [];
      poolMap[event.pool].push(event);
    }

    const result: Record<string, any> = {};
    for (const [pool, events] of Object.entries(poolMap)) {
      const avgRisk = events.reduce((sum, e) => {
        const riskMap = { low: 25, medium: 50, high: 75, critical: 100 };
        return sum + (riskMap[e.riskLevel] || 50);
      }, 0) / events.length;

      result[pool] = {
        riskScore: Math.round(avgRisk),
        attackCount: events.length,
        riskLevel: avgRisk > 75 ? 'critical' : avgRisk > 50 ? 'high' : avgRisk > 25 ? 'medium' : 'low',
      };
    }

    return result;
  }

  async getMevStats() {
    const last24h = await this.mevRepo
      .createQueryBuilder('mev')
      .where('mev.timestamp > :date', { date: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .getMany();

    const byType: Record<string, number> = {};
    const byPool: Record<string, number> = {};
    let totalProfit = 0;

    for (const event of last24h) {
      byType[event.attackType] = (byType[event.attackType] || 0) + 1;
      if (event.pool) byPool[event.pool] = (byPool[event.pool] || 0) + 1;
      totalProfit += Number(event.profitUsd) || 0;
    }

    return {
      totalEvents24h: last24h.length,
      byType,
      byPool,
      totalProfitUsd: totalProfit,
      mostTargetedPool: Object.entries(byPool).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A',
    };
  }

  async injectMockMevData() {
    const pools = ['ETH/USDC', 'MNT/USDC', 'ETH/MNT', 'USDC/USDT'];
    const attackTypes = Object.values(MevAttackType);
    const riskLevels = Object.values(MevRiskLevel);

    const numEvents = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numEvents; i++) {
      const pool = pools[Math.floor(Math.random() * pools.length)];
      const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

      await this.recordMevEvent({
        pool,
        attackType,
        riskLevel,
        gasSpike: Math.random() * 500 + 100,
        profitUsd: Math.random() * 5000 + 100,
        attackerAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
        correlationScore: Math.random() * 100,
      });
    }
  }
}
