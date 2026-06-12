import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ethers } from 'ethers';

export interface BlockData {
  number: number;
  hash: string;
  timestamp: number;
  transactions: TransactionData[];
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  data: string;
  blockNumber: number;
  blockTimestamp: number;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private lastProcessedBlock = 0;

  // Known DEX router addresses on Mantle
  private readonly DEX_ROUTERS = {
    MERCHANT_MOE: '0xeaEE7EE68874218c3558b40063c42B82D3E7232a',
    AGNI_FINANCE: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421',
    FUSION_X: '0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb',
  };

  // Known Mantle bridge address
  private readonly BRIDGE_ADDRESS = '0x95fC37A27a2f68e3A647CDc081F2706619480207';

  constructor(
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    const rpcUrl = this.config.get('MANTLE_RPC_URL', 'https://rpc.mantle.xyz');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.lastProcessedBlock = blockNumber - 10; // Start 10 blocks back
      this.logger.log(`Connected to Mantle Network. Latest block: ${blockNumber}`);
    } catch (err) {
      this.logger.warn(`Failed to connect to Mantle RPC: ${err.message}. Using mock mode.`);
    }
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async getLatestBlock(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch {
      return this.lastProcessedBlock + 1;
    }
  }

  async getBlock(blockNumber: number): Promise<ethers.Block | null> {
    try {
      return await this.provider.getBlock(blockNumber, true);
    } catch {
      return null;
    }
  }

  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    try {
      return await this.provider.getTransaction(txHash);
    } catch {
      return null;
    }
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch {
      return null;
    }
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      return await this.provider.getBalance(address);
    } catch {
      return 0n;
    }
  }

  async getTransactionHistory(address: string, fromBlock: number, toBlock: number): Promise<any[]> {
    try {
      // Query logs involving this address
      const logs = await this.provider.getLogs({
        fromBlock,
        toBlock,
        topics: [null, ethers.zeroPadValue(address, 32)],
      });
      return logs;
    } catch {
      return [];
    }
  }

  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || 0n;
    } catch {
      return 0n;
    }
  }

  isDexRouter(address: string): string | null {
    const lower = address?.toLowerCase();
    for (const [name, addr] of Object.entries(this.DEX_ROUTERS)) {
      if (addr.toLowerCase() === lower) return name;
    }
    return null;
  }

  isBridgeAddress(address: string): boolean {
    return address?.toLowerCase() === this.BRIDGE_ADDRESS.toLowerCase();
  }

  // Mock data generator for demo/hackathon when RPC is unavailable
  generateMockTransaction(walletAddress: string): TransactionData {
    const eventTypes = ['swap', 'addLiquidity', 'removeLiquidity', 'unstake', 'bridge'];
    const pools = ['ETH/USDC', 'MNT/USDC', 'ETH/MNT', 'USDC/USDT'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    return {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: walletAddress,
      to: Object.values(this.DEX_ROUTERS)[Math.floor(Math.random() * 3)],
      value: BigInt(Math.floor(Math.random() * 1e18)),
      gasPrice: BigInt(Math.floor(Math.random() * 1e9 * 100)),
      gasLimit: 200000n,
      data: `0x${Math.random().toString(16).substr(2, 8)}`,
      blockNumber: this.lastProcessedBlock + 1,
      blockTimestamp: Math.floor(Date.now() / 1000),
    };
  }

  // Decode common DEX function selectors
  decodeDexCall(data: string): { action: string; pool?: string } | null {
    const selector = data.slice(0, 10);
    const selectors: Record<string, string> = {
      '0x38ed1739': 'swapExactTokensForTokens',
      '0x8803dbee': 'swapTokensForExactTokens',
      '0xe8e33700': 'addLiquidity',
      '0xbaa2abde': 'removeLiquidity',
      '0xf305d719': 'addLiquidityETH',
      '0x02751cec': 'removeLiquidityETH',
    };
    const action = selectors[selector];
    if (!action) return null;
    return { action };
  }
}
