import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Wallet, WalletTag } from './entities/wallet.entity';
import { WalletEvent, EventType } from './entities/wallet-event.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class WalletsService implements OnModuleInit {
  private readonly logger = new Logger(WalletsService.name);

  // Real active wallets sourced from recent Mantle mainnet blocks
  private readonly SEED_WALLETS = [
    '0x0d0a1ac85183c656f3c1870c2aad4f3fa4707717',
    '0x10717911ae512c76914fff076459b3141da91e05',
    '0x0449410ef3b726138a1c2e6f1e0c3bf01bf17c1f',
    '0x588846213a30fd36244e0ae0ebb2374516da836c',
    '0x0d4dc3b8becc98782309e443a6da4b9455b5ca48',
    '0x840e1ae7b953d76ca3115c9cba2d6b320559d79e',
    '0xe9d3d4802c8525134723b13a8e66948f64650119',
  ];

  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(WalletEvent) private eventRepo: Repository<WalletEvent>,
    private eventEmitter: EventEmitter2,
    private aiService: AiService,
  ) {}

  async onModuleInit() {
    await this.seedWatchedWallets();
  }

  private async seedWatchedWallets() {
    for (const address of this.SEED_WALLETS) {
      const exists = await this.walletRepo.findOne({ where: { address } });
      if (!exists) {
        await this.walletRepo.save({
          address,
          score: 50,
          tag: WalletTag.UNKNOWN,
          exitConviction: 0,
          isWatched: true,
        });
      }
    }
    this.logger.log(`Seeded ${this.SEED_WALLETS.length} watched wallets`);
  }


  async findAll(limit = 50): Promise<Wallet[]> {
    return this.walletRepo.find({
      order: { score: 'DESC' },
      take: limit,
      relations: ['events'],
    });
  }

  async findByAddress(address: string): Promise<Wallet | null> {
    return this.walletRepo.findOne({
      where: { address },
      relations: ['events'],
    });
  }

  async findOrCreate(address: string): Promise<Wallet> {
    let wallet = await this.walletRepo.findOne({ where: { address } });
    if (!wallet) {
      wallet = await this.walletRepo.save({
        address,
        score: 50,
        tag: WalletTag.UNKNOWN,
        isWatched: false,
      });
    }
    return wallet;
  }

  async updateWalletScore(
    address: string,
    score: number,
    tag: WalletTag,
    exitConviction: number,
    explanation: string,
  ): Promise<void> {
    await this.walletRepo.update(
      { address },
      { score, tag, exitConviction, aiExplanation: explanation, lastActive: new Date() },
    );
    this.eventEmitter.emit('wallet.score.updated', { address, score, tag, exitConviction });
  }

  async recordEvent(
    walletAddress: string,
    eventType: EventType,
    amount: number,
    amountUsd: number,
    pool?: string,
    txHash?: string,
    blockNumber?: number,
    rawData?: Record<string, any>,
  ): Promise<WalletEvent> {
    const wallet = await this.findOrCreate(walletAddress);

    const event = await this.eventRepo.save({
      walletId: wallet.id,
      eventType,
      amount,
      amountUsd,
      pool,
      txHash,
      blockNumber: blockNumber || 0,
      rawData,
    });

    // Update last active
    await this.walletRepo.update({ address: walletAddress }, { lastActive: new Date() });

    this.eventEmitter.emit('wallet.event.recorded', { wallet, event });
    this.logger.log(`Recorded ${eventType} for ${walletAddress} ($${amountUsd.toFixed(0)} USD)`);

    return event;
  }

  async getRecentEvents(walletAddress?: string, limit = 100): Promise<WalletEvent[]> {
    const query = this.eventRepo.createQueryBuilder('event')
      .orderBy('event.timestamp', 'DESC')
      .take(limit);

    if (walletAddress) {
      const wallet = await this.findByAddress(walletAddress);
      if (wallet) {
        query.where('event.walletId = :id', { id: wallet.id });
      }
    }

    return query.getMany();
  }

  async getTopWalletsByExitConviction(limit = 10): Promise<Wallet[]> {
    return this.walletRepo.find({
      where: { isWatched: true },
      order: { exitConviction: 'DESC' },
      take: limit,
    });
  }

  async getEcosystemStats() {
    const total = await this.walletRepo.count();
    const smart = await this.walletRepo.count({ where: { tag: WalletTag.SMART_MONEY } });
    const mevBots = await this.walletRepo.count({ where: { tag: WalletTag.MEV_BOT } });
    const recentEvents = await this.eventRepo
      .createQueryBuilder('e')
      .where('e.timestamp > :date', { date: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .getCount();

    return { totalWallets: total, smartMoneyWallets: smart, mevBots, recentEvents24h: recentEvents };
  }

}
