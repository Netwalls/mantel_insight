import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get Telegram bot status' })
  getStatus() {
    return {
      active: true,
      subscribers: this.telegramService.getSubscriberCount(),
      commands: ['/start', '/status', '/feed', '/subscribe', '/unsubscribe'],
    };
  }

  @Post('test-alert')
  @ApiOperation({ summary: 'Send a test alert to a chat ID' })
  async sendTest(@Body('chatId') chatId: number) {
    await this.telegramService.sendManualAlert(
      [chatId],
      '🧪 *AlphaSight AI — Test Alert*\n\nYour alert system is configured correctly!',
    );
    return { sent: true };
  }
}
