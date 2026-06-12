import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { WalletPollingService } from './wallet-polling.service';
import { Wallet } from './entities/wallet.entity';
import { WalletEvent } from './entities/wallet-event.entity';

// AiModule is @Global(), AiService injected automatically

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletEvent])],
  providers: [WalletsService, WalletPollingService],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
