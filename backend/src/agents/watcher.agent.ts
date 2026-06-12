import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WalletsService } from '../wallets/wallets.service';
import { AgentsService } from './agents.service';
import { AgentId } from './entities/agent-verdict.entity';
import { WalletTag } from '../wallets/entities/wallet.entity';

@Injectable()
export class WatcherAgent implements OnModuleInit {
  private readonly logger = new Logger('WatcherAgent');
  private exitingWallets: Set<string> = new Set();

  constructor(
    private walletsService: WalletsService,
    private agentsService: AgentsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.agentsService.updateAgentStatus(AgentId.WATCHER, {
      status: 'active',
      lastAction: 'Initialized — scanning Mantle for watcher wallets movements',
    });
    this.logger.log('🔍 Watcher Agent initialized');
  }

  @Cron('*/30 * * * * *') // Every 30 seconds
  async scan() {
    this.agentsService.updateAgentStatus(AgentId.WATCHER, {
      status: 'processing',
      lastAction: 'Scanning wallets for exit sequences...',
    });

    const highConvictionWallets = await this.walletsService.getTopWalletsByExitConviction(10);

    for (const wallet of highConvictionWallets) {
      if (wallet.exitConviction >= 70) {
        const isNew = !this.exitingWallets.has(wallet.address);
        this.exitingWallets.add(wallet.address);

        if (isNew) {
          this.logger.warn(`🚨 EXIT DETECTED: ${wallet.address} (conviction: ${wallet.exitConviction})`);

          const verdict = await this.agentsService.recordVerdict(
            AgentId.WATCHER,
            `Exit sequence detected for ${wallet.tag} wallet ${wallet.address.slice(0, 10)}... Conviction score: ${wallet.exitConviction}/100`,
            undefined,
            { wallet: wallet.address, exitConviction: wallet.exitConviction, tag: wallet.tag },
          );

          // Signal the Hunter agent
          this.eventEmitter.emit('watcher.exit.detected', {
            wallet,
            verdict,
            exitConviction: wallet.exitConviction,
          });
        }
      } else {
        this.exitingWallets.delete(wallet.address);
      }
    }

    const exitCount = this.exitingWallets.size;
    this.agentsService.updateAgentStatus(AgentId.WATCHER, {
      status: 'active',
      lastAction: exitCount > 0
        ? `Tracking ${exitCount} active exit sequences`
        : 'Monitoring — no active exits detected',
    });
  }

  @OnEvent('wallet.event.recorded')
  async onWalletEvent({ wallet, event }: any) {
    // Escalate large LP removals immediately
    if (Number(event.amountUsd) > 100000 && ['lp_remove', 'unstake', 'bridge_out'].includes(event.eventType)) {
      this.logger.warn(`💰 Large ${event.eventType}: $${Number(event.amountUsd).toFixed(0)} by ${wallet.address.slice(0, 10)}...`);

      this.eventEmitter.emit('watcher.large.exit', {
        wallet,
        event,
        urgency: event.amountUsd > 500000 ? 'critical' : 'high',
      });
    }
  }
}
