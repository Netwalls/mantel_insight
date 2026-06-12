import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SignalsService } from './signals.service';
import { SignalType } from './entities/signal.entity';

@ApiTags('signals')
@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alpha signals' })
  async findAll(@Query('limit') limit = 50) {
    return this.signalsService.findAll(+limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get signal statistics' })
  async getStats() {
    return this.signalsService.getSignalStats();
  }

  @Get('high-risk')
  @ApiOperation({ summary: 'Get high-risk signals only' })
  async getHighRisk(@Query('limit') limit = 10) {
    return this.signalsService.findHighRisk(+limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get signal by ID' })
  async findOne(@Param('id') id: string) {
    return this.signalsService.findById(id);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get signals by type' })
  async findByType(@Param('type') type: SignalType) {
    return this.signalsService.findByType(type);
  }
}
