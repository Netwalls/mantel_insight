import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletEvent } from '../wallets/entities/wallet-event.entity';
import { MevEvent } from '../mev/entities/mev-event.entity';
import { Signal } from '../signals/entities/signal.entity';
import { AgentVerdict } from '../agents/entities/agent-verdict.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletEvent, MevEvent, Signal, AgentVerdict]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
