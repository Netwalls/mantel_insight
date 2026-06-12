import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum AgentId {
  WATCHER = 'watcher',
  HUNTER = 'hunter',
  ANALYST = 'analyst',
}

export enum VerdictOutcome {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  WRONG = 'wrong',
}

@Entity('agent_verdicts')
export class AgentVerdict {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AgentId })
  agentId: AgentId;

  @Column({ nullable: true })
  signalId: string;

  @Column()
  verdict: string;

  @Column({ type: 'enum', enum: VerdictOutcome, default: VerdictOutcome.PENDING })
  outcome: VerdictOutcome;

  @Column({ nullable: true })
  onChainTxHash: string;

  @Column({ nullable: true })
  onChainVerdictId: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
