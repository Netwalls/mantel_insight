import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';

@ApiTags('blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get Mantle network status' })
  async getStatus() {
    const blockNumber = await this.blockchainService.getLatestBlock();
    const gasPrice = await this.blockchainService.getGasPrice();
    return {
      network: 'Mantle',
      chainId: 5000,
      latestBlock: blockNumber,
      gasPriceGwei: Number(gasPrice) / 1e9,
      rpcUrl: 'https://rpc.mantle.xyz',
      status: 'connected',
    };
  }

  @Get('balance/:address')
  @ApiOperation({ summary: 'Get wallet MNT balance' })
  async getBalance(@Param('address') address: string) {
    const balance = await this.blockchainService.getBalance(address);
    return {
      address,
      balanceWei: balance.toString(),
      balanceMnt: Number(balance) / 1e18,
    };
  }
}
