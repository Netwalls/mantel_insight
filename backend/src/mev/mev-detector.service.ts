import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MevService } from './mev.service';
import { MevAttackType, MevRiskLevel } from './entities/mev-event.entity';

@Injectable()
export class MevDetectorService implements OnModuleInit {
  private readonly logger = new Logger(MevDetectorService.name);
  private recentGasPrices: number[] = [];
  private baselineGasPrice = 0;

  constructor(
    private blockchainService: BlockchainService,
    private mevService: MevService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    // Seed baseline gas price from current chain state
    try {
      const gas = await this.blockchainService.getGasPrice();
      this.baselineGasPrice = Number(gas) / 1e9;
      this.recentGasPrices = [this.baselineGasPrice];
      this.logger.log(`MEV detector initialized. Baseline gas: ${this.baselineGasPrice.toFixed(2)} Gwei`);
    } catch (err) {
      this.logger.warn(`Could not fetch initial gas price: ${err.message}`);
    }
  }

  @Cron('*/20 * * * * *')
  async detectMevPatterns() {
    try {
      const currentGas = await this.blockchainService.getGasPrice();
      const gasGwei = Number(currentGas) / 1e9;

      this.recentGasPrices.push(gasGwei);
      if (this.recentGasPrices.length > 100) this.recentGasPrices.shift();
      this.baselineGasPrice = this.recentGasPrices.reduce((a, b) => a + b, 0) / this.recentGasPrices.length;

      const gasSpike = this.baselineGasPrice > 0 ? gasGwei / this.baselineGasPrice : 1;

      if (gasSpike > 2.0) {
        this.logger.warn(`Gas spike: ${gasGwei.toFixed(2)} Gwei (${gasSpike.toFixed(1)}x baseline)`);
        await this.handleGasSpike(gasGwei, gasSpike);
      }
    } catch (err) {
      this.logger.debug(`MEV detection error: ${err.message}`);
    }
  }

  private async handleGasSpike(gasGwei: number, spikeMultiplier: number) {
    // Determine attack type from spike severity
    let attackType = MevAttackType.ARBITRAGE;
    let riskLevel = MevRiskLevel.MEDIUM;

    if (spikeMultiplier > 5) {
      attackType = MevAttackType.SANDWICH;
      riskLevel = MevRiskLevel.CRITICAL;
    } else if (spikeMultiplier > 3) {
      attackType = MevAttackType.FRONTRUN;
      riskLevel = MevRiskLevel.HIGH;
    }

    // Identify which pool is most active right now
    const poolRisks = await this.mevService.getPoolRiskScores();
    const topPool = Object.entries(poolRisks).sort(([, a], [, b]) => b.riskScore - a.riskScore)[0]?.[0] || 'ETH/USDC';

    await this.mevService.recordMevEvent({
      pool: topPool,
      attackType,
      riskLevel,
      gasSpike: gasGwei,
      profitUsd: gasGwei * spikeMultiplier * 10,
      attackerAddress: '0x0000000000000000000000000000000000000000',
      blockNumber: await this.blockchainService.getLatestBlock(),
    });

    this.eventEmitter.emit('mev.gas.spike', { gasGwei, spikeMultiplier, pool: topPool, attackType, riskLevel });
  }

  async getMevActivitySummary() {
    const stats = await this.mevService.getMevStats();
    const poolRisks = await this.mevService.getPoolRiskScores();

    const hotPools = Object.entries(poolRisks)
      .sort(([, a], [, b]) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map(([pool, data]) => ({ pool, ...data }));

    const dominantType = Object.entries(stats.byType).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return { hotPools, totalAttacks24h: stats.totalEvents24h, dominantAttackType: dominantType };
  }
}
