import { Module, Global, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { MevModule } from '../mev/mev.module';
import { SignalsModule } from '../signals/signals.module';
import { AgentsModule } from '../agents/agents.module';

@Global()
@Module({
  imports: [
    forwardRef(() => WalletsModule),
    forwardRef(() => MevModule),
    forwardRef(() => SignalsModule),
    forwardRef(() => AgentsModule),
  ],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
