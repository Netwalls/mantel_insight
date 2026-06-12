import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { WalletEvent } from './wallet-event.entity';

export enum WalletTag {
  SMART_MONEY = 'Watcher',
  MEV_BOT = 'MEV Bot',
  YIELD_FARMER = 'Yield Farmer',
  SCAMMER = 'Scammer',
  ACCUMULATOR = 'Accumulator',
  DISTRIBUTOR = 'Distributor',
  UNKNOWN = 'Unknown',
}

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  address: string;

  @Column({ type: 'int', default: 50 })
  score: number;

  @Column({ type: 'enum', enum: WalletTag, default: WalletTag.UNKNOWN })
  tag: WalletTag;

  @Column({ type: 'int', default: 0 })
  exitConviction: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  totalValueUsd: number;

  @Column({ nullable: true })
  lastActive: Date;

  @Column({ default: true })
  isWatched: boolean;

  @Column({ type: 'text', nullable: true })
  aiExplanation: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => WalletEvent, (event) => event.wallet)
  events: WalletEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
