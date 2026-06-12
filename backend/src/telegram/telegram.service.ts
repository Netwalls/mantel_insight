import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Telegraf, Context } from 'telegraf';
import { Signal, RiskLevel, SignalType } from '../signals/entities/signal.entity';

interface Subscriber {
  chatId: number;
  categories: Set<string>;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;
  private subscribers: Map<number, Subscriber> = new Map();
  private isRunning = false;

  private readonly ALL_CATEGORIES = ['whale', 'mev', 'exit', 'accumulation'];

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const token = this.config.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('No TELEGRAM_BOT_TOKEN set — Telegram bot disabled');
      return;
    }

    try {
      this.bot = new Telegraf(token);
      this.setupCommands();
      await this.bot.launch();
      this.isRunning = true;
      this.logger.log('Telegram bot launched');
    } catch (err) {
      this.logger.error(`Telegram bot failed: ${err.message}`);
    }
  }

  private setupCommands() {
    this.bot.command('start', (ctx) => {
      const chatId = ctx.chat.id;
      if (!this.subscribers.has(chatId)) {
        this.subscribers.set(chatId, {
          chatId,
          categories: new Set(this.ALL_CATEGORIES),
        });
      }

      ctx.reply(
        `🔭 *Welcome to AlphaSight AI*\n\n` +
        `You're now subscribed to all alerts:\n` +
        `🐳 Whale movements\n` +
        `⚠️ MEV risk warnings\n` +
        `🚨 Exit sequences\n` +
        `🟢 Accumulation signals\n\n` +
        `Commands:\n` +
        `/status - System status\n` +
        `/subscribe [whale|mev|exit|accumulation] - Toggle category\n` +
        `/unsubscribe - Stop all alerts\n` +
        `/feed - Latest 3 signals`,
        { parse_mode: 'Markdown' },
      );
    });

    this.bot.command('status', async (ctx) => {
      ctx.reply(
        `🟢 *AlphaSight AI — LIVE*\n\n` +
        `Network: Mantle (Chain ID 5000)\n` +
        `Agents: Watcher ✅ | Hunter ✅ | Analyst ✅\n` +
        `Subscribers: ${this.subscribers.size}\n` +
        `Dashboard: https://alphasight.ai`,
        { parse_mode: 'Markdown' },
      );
    });

    this.bot.command('feed', async (ctx) => {
      ctx.reply('📡 Fetching latest signals...');
    });

    this.bot.command('unsubscribe', (ctx) => {
      this.subscribers.delete(ctx.chat.id);
      ctx.reply('✅ Unsubscribed from all AlphaSight alerts.');
    });

    this.bot.command('subscribe', (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      const chatId = ctx.chat.id;

      if (!this.subscribers.has(chatId)) {
        this.subscribers.set(chatId, { chatId, categories: new Set() });
      }

      const sub = this.subscribers.get(chatId)!;

      if (args.length === 0) {
        sub.categories = new Set(this.ALL_CATEGORIES);
        ctx.reply('✅ Subscribed to all alert categories.');
      } else {
        args.forEach((cat) => {
          if (this.ALL_CATEGORIES.includes(cat)) sub.categories.add(cat);
        });
        ctx.reply(`✅ Subscribed to: ${Array.from(sub.categories).join(', ')}`);
      }
    });
  }

  @OnEvent('signal.generated')
  async onSignalGenerated(signal: Signal) {
    if (!this.isRunning || this.subscribers.size === 0) return;

    const category = this.getCategory(signal.type);
    const message = this.formatSignalMessage(signal);

    for (const [, sub] of this.subscribers) {
      if (sub.categories.has(category)) {
        try {
          await this.bot.telegram.sendMessage(sub.chatId, message, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true },
          });
        } catch (err) {
          this.logger.debug(`Failed to send to ${sub.chatId}: ${err.message}`);
        }
      }
    }
  }

  private getCategory(type: SignalType): string {
    const map: Record<SignalType, string> = {
      [SignalType.WHALE_ALERT]: 'whale',
      [SignalType.MEV_RISK]: 'mev',
      [SignalType.EXIT_WARNING]: 'exit',
      [SignalType.ACCUMULATION]: 'accumulation',
      [SignalType.BULLISH]: 'accumulation',
      [SignalType.BEARISH]: 'exit',
    };
    return map[type] || 'whale';
  }

  private formatSignalMessage(signal: Signal): string {
    const icons: Record<SignalType, string> = {
      [SignalType.EXIT_WARNING]: '🚨',
      [SignalType.MEV_RISK]: '⚠️',
      [SignalType.WHALE_ALERT]: '🐳',
      [SignalType.ACCUMULATION]: '🟢',
      [SignalType.BULLISH]: '📈',
      [SignalType.BEARISH]: '📉',
    };

    const riskEmoji: Record<RiskLevel, string> = {
      [RiskLevel.LOW]: '🟢',
      [RiskLevel.MEDIUM]: '🟡',
      [RiskLevel.HIGH]: '🟠',
      [RiskLevel.CRITICAL]: '🔴',
    };

    const icon = icons[signal.type] || '📡';
    const riskIcon = riskEmoji[signal.riskLevel] || '🟡';

    return (
      `${icon} *${signal.type.toUpperCase()} — ${signal.riskLevel.toUpperCase()}*\n\n` +
      `${riskIcon} Risk Level: ${signal.riskLevel.toUpperCase()}\n` +
      `📊 Confidence: ${signal.confidence}%\n` +
      (signal.pool ? `🏊 Pool: ${signal.pool}\n` : '') +
      `\n💬 *AI Insight:*\n${signal.explanation}\n\n` +
      (signal.action ? `⚡ *Action:* ${signal.action}\n\n` : '') +
      `🕐 ${new Date(signal.timestamp).toISOString()}\n` +
      `[View Dashboard →](https://alphasight.ai/dashboard)`
    );
  }

  async sendManualAlert(chatIds: number[], message: string): Promise<void> {
    if (!this.isRunning) return;
    for (const chatId of chatIds) {
      try {
        await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (err) {
        this.logger.debug(`Manual alert failed for ${chatId}: ${err.message}`);
      }
    }
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  async onModuleDestroy() {
    if (this.bot && this.isRunning) {
      this.bot.stop('SIGTERM');
    }
  }
}
