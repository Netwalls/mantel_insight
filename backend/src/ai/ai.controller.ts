import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { WalletsService } from '../wallets/wallets.service';
import { MevService } from '../mev/mev.service';
import { SignalsService } from '../signals/signals.service';
import { AgentsService } from '../agents/agents.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly walletsService: WalletsService,
    private readonly mevService: MevService,
    private readonly signalsService: SignalsService,
    private readonly agentsService: AgentsService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Ask Alpha — AI chat interface' })
  async chat(@Body('message') message: string) {
    if (!message?.trim()) {
      return { error: 'Message is required' };
    }

    // Build rich context for the AI
    const [walletStats, mevStats, recentSignals, agentStatuses] = await Promise.all([
      this.walletsService.getEcosystemStats(),
      this.mevService.getMevStats(),
      this.signalsService.findAll(5),
      Promise.resolve(this.agentsService.getAllStatuses()),
    ]);

    const context = {
      timestamp: new Date().toISOString(),
      network: 'Mantle Network (Chain ID 5000)',
      walletStats,
      mevStats,
      recentSignals: recentSignals.map((s) => ({
        type: s.type,
        confidence: s.confidence,
        riskLevel: s.riskLevel,
        explanation: s.explanation,
        timestamp: s.timestamp,
      })),
      agentStatuses: agentStatuses.map((a) => ({
        name: a.name,
        status: a.status,
        lastAction: a.lastAction,
      })),
    };

    const response = await this.aiService.chat(message, context);
    return { response, timestamp: new Date().toISOString() };
  }

  @Get('chat/suggestions')
  @ApiOperation({ summary: 'Get suggested questions for Ask Alpha' })
  getSuggestions() {
    return {
      suggestions: [
        'What are whales doing on Mantle right now?',
        'Is Merchant Moe safe to LP in?',
        'Where is MEV risk highest today?',
        'Which pools should I avoid?',
        'What are the top signals in the last hour?',
        'Analyze the current exit sequence pattern',
        'What do the 3 agents currently see?',
      ],
    };
  }
}
