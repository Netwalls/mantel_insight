import { Module } from '@nestjs/common';
import { AlphaSightGateway } from './alphasight.gateway';
import { SignalsModule } from '../signals/signals.module';
import { WalletsModule } from '../wallets/wallets.module';
import { MevModule } from '../mev/mev.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [SignalsModule, WalletsModule, MevModule, AgentsModule],
  providers: [AlphaSightGateway],
  exports: [AlphaSightGateway],
})
export class WebsocketModule {}
