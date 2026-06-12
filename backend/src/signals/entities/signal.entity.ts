import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum SignalType {
  BULLISH = 'Bullish',
  BEARISH = 'Bearish',
  MEV_RISK = 'MEV Risk',
  WHALE_ALERT = 'Whale Alert',
  EXIT_WARNING = 'Exit Warning',
  ACCUMULATION = 'Accumulation',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('signals')
export class Signal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SignalType })
  type: SignalType;

  @Column({ type: 'int', default: 50 })
  confidence: number;

  @Column({ type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIUM })
  riskLevel: RiskLevel;

  @Column({ type: 'text' })
  explanation: string;

  @Column({ type: 'text', nullable: true })
  action: string;

  @Column({ nullable: true })
  pool: string;

  @Column({ nullable: true })
  onChainTxHash: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence: Record<string, any>;

  @Column({ default: false })
  telegramSent: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
