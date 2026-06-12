import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { SignalsModule } from '../signals/signals.module';

@Module({
  imports: [SignalsModule],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
