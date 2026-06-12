import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const ALPHASIGHT_ABI = [
  'function storeVerdict(string memory _signalType, uint8 _confidence, string memory _pool, address _agentId) external returns (uint256)',
  'function updateOutcome(uint256 _id, string memory _outcome) external',
  'function getVerdict(uint256 _id) external view returns (tuple(string signalType, uint8 confidence, uint256 timestamp, string pool, address agentId, string outcome))',
  'function totalVerdicts() external view returns (uint256)',
  'event VerdictStored(uint256 indexed id, string signalType, uint8 confidence, string pool)',
];

// Dummy agent address (ERC-8004 identity)
const AGENT_IDENTITY = '0x0000000000000000000000000000000000000001';

@Injectable()
export class ContractsService implements OnModuleInit {
  private readonly logger = new Logger(ContractsService.name);
  private contract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider;

  // In-memory verdicts for demo when contract is not deployed
  private mockVerdicts: Array<{
    id: number;
    signalType: string;
    confidence: number;
    timestamp: number;
    pool: string;
    agentId: string;
    outcome: string;
    txHash: string;
  }> = [];

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    try {
      // Use separate contract RPC (Sepolia) if configured, otherwise fall back to main RPC
      const rpcUrl = this.config.get('MANTLE_CONTRACT_RPC_URL') || this.config.get('MANTLE_RPC_URL', 'https://rpc.mantle.xyz');
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      const privateKey = this.config.get('DEPLOYER_PRIVATE_KEY');
      const contractAddress = this.config.get('CONTRACT_ADDRESS');

      if (privateKey && contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, ALPHASIGHT_ABI, this.wallet);
        this.logger.log(`Connected to AlphaSight contract at ${contractAddress}`);
      } else {
        this.logger.warn('Contract not configured — using mock on-chain storage for demo');
        this.seedMockVerdicts();
      }
    } catch (err) {
      this.logger.warn(`Contract init failed: ${err.message} — using mock mode`);
      this.seedMockVerdicts();
    }
  }

  private seedMockVerdicts() {
    const types = ['Exit Warning', 'MEV Risk', 'Whale Alert', 'Accumulation'];
    const pools = ['ETH/USDC', 'MNT/USDC', 'ETH/MNT'];

    for (let i = 0; i < 8; i++) {
      this.mockVerdicts.push({
        id: i,
        signalType: types[i % types.length],
        confidence: 70 + Math.floor(Math.random() * 28),
        timestamp: Math.floor(Date.now() / 1000) - i * 3600,
        pool: pools[i % pools.length],
        agentId: AGENT_IDENTITY,
        outcome: i < 3 ? 'confirmed' : i < 5 ? 'wrong' : 'pending',
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      });
    }
  }

  async storeVerdict(
    signalType: string,
    confidence: number,
    pool: string,
  ): Promise<number | null> {
    if (this.contract) {
      try {
        const tx = await this.contract.storeVerdict(
          signalType,
          Math.min(confidence, 100),
          pool,
          AGENT_IDENTITY,
        );
        const receipt = await tx.wait();
        const event = receipt.logs.find((l: any) => l.eventName === 'VerdictStored');
        const id = Number(event?.args?.[0] || 0);
        this.logger.log(`✅ Verdict stored on-chain: tx ${tx.hash}, id ${id}`);
        return id;
      } catch (err) {
        this.logger.error(`Failed to store verdict on-chain: ${err.message}`);
        return this.storeMockVerdict(signalType, confidence, pool);
      }
    }

    return this.storeMockVerdict(signalType, confidence, pool);
  }

  private storeMockVerdict(signalType: string, confidence: number, pool: string): number {
    const id = this.mockVerdicts.length;
    this.mockVerdicts.push({
      id,
      signalType,
      confidence,
      timestamp: Math.floor(Date.now() / 1000),
      pool,
      agentId: AGENT_IDENTITY,
      outcome: 'pending',
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    });
    this.logger.log(`Mock on-chain verdict stored: ID ${id} (${signalType}, ${confidence}%)`);
    return id;
  }

  async updateOutcome(id: number, outcome: string): Promise<void> {
    if (this.contract) {
      try {
        const tx = await this.contract.updateOutcome(id, outcome);
        await tx.wait();
        return;
      } catch (err) {
        this.logger.error(`Failed to update outcome: ${err.message}`);
      }
    }

    const verdict = this.mockVerdicts.find((v) => v.id === id);
    if (verdict) verdict.outcome = outcome;
  }

  async getVerdict(id: number): Promise<any> {
    if (this.contract) {
      try {
        return await this.contract.getVerdict(id);
      } catch (err) {
        this.logger.debug(`Contract read failed: ${err.message}`);
      }
    }

    return this.mockVerdicts.find((v) => v.id === id) || null;
  }

  async getTotalVerdicts(): Promise<number> {
    if (this.contract) {
      try {
        return Number(await this.contract.totalVerdicts());
      } catch {
        return this.mockVerdicts.length;
      }
    }
    return this.mockVerdicts.length;
  }

  async getAllVerdicts() {
    if (this.contract) {
      try {
        const total = Number(await this.contract.totalVerdicts());
        const verdicts: any[] = [];
        for (let i = 0; i < Math.min(total, 50); i++) {
          const v = await this.contract.getVerdict(i);
          verdicts.push({
            id: i,
            signalType: v.signalType,
            confidence: Number(v.confidence),
            timestamp: Number(v.timestamp),
            pool: v.pool,
            agentId: v.agentId,
            outcome: v.outcome,
          });
        }
        return verdicts.reverse();
      } catch (err) {
        this.logger.error(`Failed to fetch on-chain verdicts: ${err.message}`);
      }
    }
    return this.mockVerdicts;
  }

  async getAllMockVerdicts() {
    return this.getAllVerdicts();
  }

  getContractAddress(): string {
    return this.config.get('CONTRACT_ADDRESS') || 'Not deployed (demo mode)';
  }

  isLive(): boolean {
    return !!this.contract;
  }
}
