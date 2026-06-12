import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MevService } from '../mev/mev.service';
import { AgentsService } from './agents.service';
import { AgentId } from './entities/agent-verdict.entity';
import { MevRiskLevel } from '../mev/entities/mev-event.entity';

@Injectable()
export class HunterAgent implements OnModuleInit {
  private readonly logger = new Logger('HunterAgent');
  private activeHunts: Map<string, { startTime: Date; exitConviction: number }> = new Map();

  constructor(
    private mevService: MevService,
    private agentsService: AgentsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.agentsService.updateAgentStatus(AgentId.HUNTER, {
      status: 'idle',
      lastAction: 'Standing by — activates on Watcher signal',
    });
    this.logger.log('🎯 Hunter Agent initialized');
  }

  @OnEvent('watcher.exit.detected')
  async onExitDetected({ wallet, verdict, exitConviction }: any) {
    this.logger.log(`🎯 Hunter activated by Watcher for wallet ${wallet.address.slice(0, 10)}...`);

    this.agentsService.updateAgentStatus(AgentId.HUNTER, {
      status: 'processing',
      lastAction: `Scanning MEV patterns after exit from ${wallet.address.slice(0, 10)}...`,
    });

    this.activeHunts.set(wallet.address, { startTime: new Date(), exitConviction });

    // Scan pools for MEV activity
    const poolRisks = await this.mevService.getPoolRiskScores();
    const recentMev = await this.mevService.getRecentEvents(20);

    // Find high-risk pools
    const criticalPools = Object.entries(poolRisks)
      .filter(([, risk]) => risk.riskScore > 70)
      .map(([pool, risk]) => ({ pool, ...risk }));

    if (criticalPools.length > 0) {
      const topPool = criticalPools[0];

      const mevVerdictText = `MEV probability ELEVATED on ${topPool.pool} following exit sequence. ` +
        `${recentMev.length} MEV events detected in correlation window. ` +
        `Risk score: ${topPool.riskScore}/100.`;

      const mevVerdict = await this.agentsService.recordVerdict(
        AgentId.HUNTER,
        mevVerdictText,
        verdict?.id,
        {
          triggeredByWallet: wallet.address,
          criticalPools,
          mevEventCount: recentMev.length,
          exitConviction,
        },
      );

      // Signal the Analyst
      this.eventEmitter.emit('hunter.mev.detected', {
        wallet,
        mevVerdict,
        criticalPools,
        recentMev: recentMev.slice(0, 5),
        exitVerdict: verdict,
      });
    }

    this.agentsService.updateAgentStatus(AgentId.HUNTER, {
      status: 'active',
      lastAction: `Monitoring ${criticalPools.length} high-risk pools after exit sequence`,
    });
  }

  @OnEvent('watcher.large.exit')
  async onLargeExit({ wallet, event, urgency }: any) {
    this.logger.warn(`🎯 Hunter: Large exit detected — scanning immediately (urgency: ${urgency})`);

    const mevData = await this.mevService.getMevStats();
    const poolRisks = await this.mevService.getPoolRiskScores();

    const poolRisk = event.pool ? poolRisks[event.pool] : null;

    await this.agentsService.recordVerdict(
      AgentId.HUNTER,
      `Large ${event.eventType} of $${Number(event.amountUsd).toFixed(0)} on ${event.pool || 'unknown pool'}. ` +
      `Pool risk score: ${poolRisk?.riskScore || 'N/A'}. Urgency: ${urgency}.`,
      undefined,
      { wallet: wallet.address, eventType: event.eventType, amountUsd: event.amountUsd, urgency },
    );
  }

  getActiveHunts(): Array<{ wallet: string; duration: number; exitConviction: number }> {
    return Array.from(this.activeHunts.entries()).map(([wallet, data]) => ({
      wallet,
      duration: Math.floor((Date.now() - data.startTime.getTime()) / 1000 / 60),
      exitConviction: data.exitConviction,
    }));
  }
}
