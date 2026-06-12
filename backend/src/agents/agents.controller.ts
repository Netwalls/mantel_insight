import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { HunterAgent } from './hunter.agent';
import { VerdictOutcome } from './entities/agent-verdict.entity';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly hunterAgent: HunterAgent,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get all agent statuses' })
  getStatuses() {
    return this.agentsService.getAllStatuses();
  }

  @Get('verdicts')
  @ApiOperation({ summary: 'Get recent agent verdicts' })
  async getVerdicts() {
    return this.agentsService.getRecentVerdicts(20);
  }

  @Get('verdicts/stats')
  @ApiOperation({ summary: 'Get verdict statistics' })
  async getVerdictStats() {
    return this.agentsService.getVerdictStats();
  }

  @Get('hunter/hunts')
  @ApiOperation({ summary: 'Get active Hunter agent hunts' })
  getActiveHunts() {
    return this.hunterAgent.getActiveHunts();
  }

  @Patch('verdicts/:id/outcome')
  @ApiOperation({ summary: 'Update verdict outcome' })
  async updateOutcome(
    @Param('id') id: string,
    @Body('outcome') outcome: VerdictOutcome,
    @Body('txHash') txHash?: string,
  ) {
    await this.agentsService.updateVerdictOutcome(id, outcome, txHash);
    return { success: true };
  }
}
