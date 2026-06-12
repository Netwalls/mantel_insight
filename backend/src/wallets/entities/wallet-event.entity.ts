import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum EventType {
  BUY = 'buy',
  SELL = 'sell',
  LP_ADD = 'lp_add',
  LP_REMOVE = 'lp_remove',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  BRIDGE_OUT = 'bridge_out',
  BRIDGE_IN = 'bridge_in',
  TRANSFER = 'transfer',
  SILENCE = 'silence',
}

@Entity('wallet_events')
export class WalletEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.events)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({ type: 'enum', enum: EventType })
  eventType: EventType;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  amountUsd: number;

  @Column({ nullable: true })
  pool: string;

  @Column({ nullable: true })
  token: string;

  @Column({ nullable: true })
  txHash: string;

  @Column({ type: 'int', default: 0 })
  blockNumber: number;

  @Column({ type: 'jsonb', nullable: true })
  rawData: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}
