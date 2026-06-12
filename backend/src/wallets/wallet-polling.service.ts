import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WalletsService } from './wallets.service';
import { AiService } from '../ai/ai.service';
import { Wallet } from './entities/wallet.entity';
import { EventType } from './entities/wallet-event.entity';

@Injectable()
export class WalletPollingService implements OnModuleInit {
  private readonly logger = new Logger(WalletPollingService.name);
  private lastBlock = 0;
  private isPolling = false;

  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    private blockchainService: BlockchainService,
    private walletsService: WalletsService,
    private aiService: AiService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    try {
      this.lastBlock = await this.blockchainService.getLatestBlock();
      this.logger.log(`Wallet polling initialized at block ${this.lastBlock}`);
    } catch (err) {
      this.logger.error(`Could not get initial block: ${err.message}`);
    }
  }

  @Cron('*/30 * * * * *')
  async pollWalletActivity() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const currentBlock = await this.blockchainService.getLatestBlock();
      if (currentBlock <= this.lastBlock) return;

      const watchedWallets = await this.walletRepo.find({ where: { isWatched: true } });

      for (const wallet of watchedWallets) {
        await this.analyzeWalletActivity(wallet, this.lastBlock, currentBlock);
      }

      this.lastBlock = currentBlock;
    } catch (err) {
      this.logger.error(`Polling error: ${err.message}`);
    } finally {
      this.isPolling = false;
    }
  }

  private async analyzeWalletActivity(wallet: Wallet, fromBlock: number, toBlock: number) {
    try {
      const logs = await this.blockchainService.getTransactionHistory(
        wallet.address, fromBlock, toBlock,
      );

      if (logs.length === 0) return;

      for (const log of logs.slice(0, 5)) {
        const eventType = this.classifyLogEvent(log);
        if (eventType) {
          await this.walletsService.recordEvent(
            wallet.address,
            eventType,
            0,
            0,
            undefined,
            log.transactionHash,
            log.blockNumber,
            log,
          );
        }
      }

      // Re-classify wallet via AI when we have new activity
      const events = await this.walletsService.getRecentEvents(wallet.address, 20);
      if (events.length > 0) {
        const classification = await this.aiService.classifyWallet(wallet.address, events);
        if (classification) {
          await this.walletsService.updateWalletScore(
            wallet.address,
            classification.score,
            classification.tag,
            classification.exit_conviction,
            classification.explanation,
          );
        }
      }
    } catch (err) {
      this.logger.debug(`Skipping wallet ${wallet.address}: ${err.message}`);
    }
  }

  private classifyLogEvent(log: any): EventType | null {
    if (!log.topics || log.topics.length === 0) return null;

    const topicMap: Record<string, EventType> = {
      '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822': EventType.BUY,
      '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb': EventType.SELL,
      '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9': EventType.LP_ADD,
      '0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496': EventType.LP_REMOVE,
    };

    return topicMap[log.topics[0]] || EventType.TRANSFER;
  }
}
