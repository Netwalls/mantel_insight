import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';

@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get contract deployment info' })
  getInfo() {
    return {
      address: this.contractsService.getContractAddress(),
      network: 'Mantle Sepolia (verdicts) · Mainnet (surveillance)',
      chainId: 5003,
      explorerUrl: 'https://explorer.sepolia.mantle.xyz',
      isLive: this.contractsService.isLive(),
    };
  }

  @Get('verdicts')
  @ApiOperation({ summary: 'Get all on-chain verdicts' })
  async getAllVerdicts() {
    return this.contractsService.getAllMockVerdicts();
  }

  @Get('verdicts/total')
  @ApiOperation({ summary: 'Get total verdict count' })
  async getTotal() {
    const total = await this.contractsService.getTotalVerdicts();
    return { total };
  }

  @Get('verdicts/:id')
  @ApiOperation({ summary: 'Get specific verdict by ID' })
  async getVerdict(@Param('id') id: string) {
    return this.contractsService.getVerdict(parseInt(id));
  }

  @Patch('verdicts/:id/outcome')
  @ApiOperation({ summary: 'Update verdict outcome' })
  async updateOutcome(
    @Param('id') id: string,
    @Body('outcome') outcome: string,
  ) {
    await this.contractsService.updateOutcome(parseInt(id), outcome);
    return { success: true };
  }
}
