import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsService } from './agents.service';
import { WatcherAgent } from './watcher.agent';
import { HunterAgent } from './hunter.agent';
import { AnalystAgent } from './analyst.agent';
import { AgentsController } from './agents.controller';
import { AgentVerdict } from './entities/agent-verdict.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { MevModule } from '../mev/mev.module';
import { SignalsModule } from '../signals/signals.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentVerdict]),
    WalletsModule,
    MevModule,
    SignalsModule,
    ContractsModule,
  ],
  providers: [AgentsService, WatcherAgent, HunterAgent, AnalystAgent],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
