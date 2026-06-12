import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all watched wallets with scores' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('limit') limit = 50) {
    return this.walletsService.findAll(+limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ecosystem-wide wallet statistics' })
  async getStats() {
    return this.walletsService.getEcosystemStats();
  }

  @Get('exiting')
  @ApiOperation({ summary: 'Get wallets with highest exit conviction' })
  async getExiting() {
    return this.walletsService.getTopWalletsByExitConviction(10);
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get wallet details by address' })
  async findOne(@Param('address') address: string) {
    return this.walletsService.findByAddress(address);
  }

  @Get(':address/events')
  @ApiOperation({ summary: 'Get recent events for a wallet' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEvents(
    @Param('address') address: string,
    @Query('limit') limit = 50,
  ) {
    return this.walletsService.getRecentEvents(address, +limit);
  }
}
