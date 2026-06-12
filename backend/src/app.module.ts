import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BlockchainModule } from './blockchain/blockchain.module';
import { WalletsModule } from './wallets/wallets.module';
import { MevModule } from './mev/mev.module';
import { SignalsModule } from './signals/signals.module';
import { AgentsModule } from './agents/agents.module';
import { AiModule } from './ai/ai.module';
import { TelegramModule } from './telegram/telegram.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ContractsModule } from './contracts/contracts.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: false,
      }),
    }),
    DatabaseModule,
    BlockchainModule,
    ContractsModule,
    AiModule,       // Global — must load before modules that inject AiService
    WalletsModule,
    MevModule,
    SignalsModule,
    AgentsModule,
    TelegramModule,
    WebsocketModule,
  ],
})
export class AppModule {}
