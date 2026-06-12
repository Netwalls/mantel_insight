import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MevService } from './mev.service';
import { MevDetectorService } from './mev-detector.service';

@ApiTags('mev')
@Controller('mev')
export class MevController {
  constructor(
    private readonly mevService: MevService,
    private readonly mevDetector: MevDetectorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get recent MEV events' })
  async getRecentEvents(@Query('limit') limit = 50) {
    return this.mevService.getRecentEvents(+limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get MEV statistics for last 24 hours' })
  async getStats() {
    return this.mevService.getMevStats();
  }

  @Get('pool-risks')
  @ApiOperation({ summary: 'Get risk scores per pool' })
  async getPoolRisks() {
    return this.mevService.getPoolRiskScores();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get MEV activity summary with hot pools' })
  async getSummary() {
    return this.mevDetector.getMevActivitySummary();
  }

  @Get('pool/:pool')
  @ApiOperation({ summary: 'Get MEV events for a specific pool' })
  async getPoolEvents(@Query('pool') pool: string, @Query('limit') limit = 20) {
    return this.mevService.getEventsByPool(pool, +limit);
  }
}
