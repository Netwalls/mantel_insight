import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum MevAttackType {
  SANDWICH = 'sandwich',
  FRONTRUN = 'frontrun',
  ARBITRAGE = 'arbitrage',
  BACKRUN = 'backrun',
  LIQUIDATION = 'liquidation',
}

export enum MevRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('mev_events')
export class MevEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  pool: string;

  @Column({ type: 'enum', enum: MevAttackType })
  attackType: MevAttackType;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: 0 })
  gasSpike: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  profitUsd: number;

  @Column({ nullable: true })
  attackerAddress: string;

  @Column({ nullable: true })
  victimTxHash: string;

  @Column({ nullable: true })
  attackTxHash: string;

  @Column({ type: 'int', default: 0 })
  blockNumber: number;

  @Column({ type: 'enum', enum: MevRiskLevel, default: MevRiskLevel.MEDIUM })
  riskLevel: MevRiskLevel;

  // Links to a correlated whale exit if applicable
  @Column({ nullable: true })
  correlatedExitId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  correlationScore: number;

  @Column({ type: 'jsonb', nullable: true })
  rawData: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}
