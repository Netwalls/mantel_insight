import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalsService } from './signals.service';
import { SignalsController } from './signals.controller';
import { Signal } from './entities/signal.entity';
import { MevModule } from '../mev/mev.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [TypeOrmModule.forFeature([Signal]), MevModule, WalletsModule],
  providers: [SignalsService],
  controllers: [SignalsController],
  exports: [SignalsService],
})
export class SignalsModule {}
