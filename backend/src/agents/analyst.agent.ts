import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AgentsService } from './agents.service';
import { AiService } from '../ai/ai.service';
import { SignalsService } from '../signals/signals.service';
import { ContractsService } from '../contracts/contracts.service';
import { AgentId, VerdictOutcome } from './entities/agent-verdict.entity';

@Injectable()
export class AnalystAgent implements OnModuleInit {
  private readonly logger = new Logger('AnalystAgent');
  private analysisCount = 0;

  constructor(
    private agentsService: AgentsService,
    private aiService: AiService,
    private signalsService: SignalsService,
    private contractsService: ContractsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.agentsService.updateAgentStatus(AgentId.ANALYST, {
      status: 'idle',
      lastAction: 'Awaiting Watcher + Hunter signals',
    });
    this.logger.log('🧠 Analyst Agent initialized');
  }

  @OnEvent('hunter.mev.detected')
  async onHunterSignal({ wallet, mevVerdict, criticalPools, recentMev, exitVerdict }: any) {
    this.analysisCount++;
    this.logger.log(`🧠 Analyst performing correlation analysis #${this.analysisCount}`);

    this.agentsService.updateAgentStatus(AgentId.ANALYST, {
      status: 'processing',
      lastAction: `Running pattern correlation #${this.analysisCount}...`,
    });

    // Get hours between exit and MEV
    const hoursBetween = mevVerdict?.createdAt
      ? (Date.now() - new Date(mevVerdict.createdAt).getTime()) / 3600000
      : 2;

    // AI correlation
    const correlation = await this.aiService.correlateMevWithExit(
      [exitVerdict],
      recentMev,
      hoursBetween,
    );

    const finalVerdict = `CORRELATION CONFIRMED (${correlation.correlation_strength}%): ` +
      correlation.explanation +
      ` Prediction: ${correlation.prediction}`;

    // Record analyst verdict
    const analystVerdict = await this.agentsService.recordVerdict(
      AgentId.ANALYST,
      finalVerdict,
      exitVerdict?.id || mevVerdict?.id,
      {
        correlationStrength: correlation.correlation_strength,
        correlated: correlation.correlated,
        criticalPools: criticalPools?.length,
        prediction: correlation.prediction,
      },
    );

    // Generate and store on-chain signal
    try {
      const topPool = criticalPools?.[0]?.pool || 'ETH/USDC';
      const confidence = Math.min(
        Math.round((correlation.correlation_strength + (wallet?.exitConviction || 50)) / 2),
        99,
      );

      const onChainId = await this.contractsService.storeVerdict(
        'Exit Warning',
        confidence,
        topPool,
      );

      if (onChainId !== null) {
        await this.agentsService.updateOnChainData(
          analystVerdict.id,
          `on-chain-verdict-${onChainId}`,
          onChainId,
        );
        this.logger.log(`✅ Verdict stored on-chain: ID ${onChainId}`);
      }
    } catch (err) {
      this.logger.warn(`On-chain storage failed: ${err.message}`);
    }

    // Generate signal
    await this.signalsService.generateSignals();

    this.agentsService.updateAgentStatus(AgentId.ANALYST, {
      status: 'active',
      lastAction: `Verdict #${this.analysisCount} complete: ${correlation.correlated ? '⚠️ CORRELATED' : '✅ LOW RISK'}`,
    });

    this.eventEmitter.emit('analyst.verdict.complete', {
      analystVerdict,
      correlation,
      analysisCount: this.analysisCount,
    });
  }

  @OnEvent('signal.generated')
  async onNewSignal(signal: any) {
    // Mark high-confidence signals for on-chain storage
    if (signal.confidence >= 85 && ['Exit Warning', 'MEV Risk'].includes(signal.type)) {
      try {
        const onChainId = await this.contractsService.storeVerdict(
          signal.type,
          signal.confidence,
          signal.pool || 'Mantle Network',
        );

        if (onChainId !== null) {
          await this.signalsService.updateOnChainHash(
            signal.id,
            `verdict-${onChainId}`,
          );
          this.logger.log(`📝 High-confidence signal stored on-chain: ${signal.type} (${signal.confidence}%)`);
        }
      } catch (err) {
        this.logger.debug(`On-chain signal storage: ${err.message}`);
      }
    }
  }
}
