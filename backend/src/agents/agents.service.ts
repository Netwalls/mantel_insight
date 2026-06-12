import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AgentVerdict, AgentId, VerdictOutcome } from './entities/agent-verdict.entity';

export interface AgentStatus {
  id: AgentId;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'processing';
  lastAction: string;
  lastActionTime: Date;
  verdictsTotal: number;
  verdictsPending: number;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private agentStatuses: Map<AgentId, AgentStatus> = new Map();

  constructor(
    @InjectRepository(AgentVerdict) private verdictRepo: Repository<AgentVerdict>,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializeAgentStatuses();
  }

  private initializeAgentStatuses() {
    this.agentStatuses.set(AgentId.WATCHER, {
      id: AgentId.WATCHER,
      name: 'The Watcher',
      role: 'Watcher wallets surveillance',
      status: 'active',
      lastAction: 'Monitoring wallet activity',
      lastActionTime: new Date(),
      verdictsTotal: 0,
      verdictsPending: 0,
    });

    this.agentStatuses.set(AgentId.HUNTER, {
      id: AgentId.HUNTER,
      name: 'The Hunter',
      role: 'MEV pattern detection',
      status: 'idle',
      lastAction: 'Standing by for Watcher signal',
      lastActionTime: new Date(),
      verdictsTotal: 0,
      verdictsPending: 0,
    });

    this.agentStatuses.set(AgentId.ANALYST, {
      id: AgentId.ANALYST,
      name: 'The Analyst',
      role: 'Correlation + verdict',
      status: 'idle',
      lastAction: 'Awaiting agent signals',
      lastActionTime: new Date(),
      verdictsTotal: 0,
      verdictsPending: 0,
    });
  }

  async recordVerdict(
    agentId: AgentId,
    verdict: string,
    signalId?: string,
    metadata?: Record<string, any>,
  ): Promise<AgentVerdict> {
    const record = await this.verdictRepo.save({
      agentId,
      verdict,
      signalId,
      outcome: VerdictOutcome.PENDING,
      metadata,
    });

    const status = this.agentStatuses.get(agentId);
    if (status) {
      status.verdictsTotal++;
      status.verdictsPending++;
      status.lastAction = verdict.slice(0, 80);
      status.lastActionTime = new Date();
    }

    this.eventEmitter.emit('agent.verdict.recorded', { agentId, verdict: record });
    return record;
  }

  async updateVerdictOutcome(id: string, outcome: VerdictOutcome, onChainTxHash?: string): Promise<void> {
    await this.verdictRepo.update({ id }, { outcome, onChainTxHash });
    this.eventEmitter.emit('agent.verdict.updated', { id, outcome });
  }

  async updateOnChainData(id: string, txHash: string, onChainId: number): Promise<void> {
    await this.verdictRepo.update({ id }, { onChainTxHash: txHash, onChainVerdictId: onChainId });
  }

  updateAgentStatus(agentId: AgentId, update: Partial<AgentStatus>) {
    const existing = this.agentStatuses.get(agentId);
    if (existing) {
      Object.assign(existing, update, { lastActionTime: new Date() });
      this.eventEmitter.emit('agent.status.updated', existing);
    }
  }

  getAllStatuses(): AgentStatus[] {
    return Array.from(this.agentStatuses.values());
  }

  getStatus(agentId: AgentId): AgentStatus | undefined {
    return this.agentStatuses.get(agentId);
  }

  async getRecentVerdicts(limit = 20): Promise<AgentVerdict[]> {
    return this.verdictRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getVerdictStats() {
    const total = await this.verdictRepo.count();
    const confirmed = await this.verdictRepo.count({ where: { outcome: VerdictOutcome.CONFIRMED } });
    const wrong = await this.verdictRepo.count({ where: { outcome: VerdictOutcome.WRONG } });
    const pending = await this.verdictRepo.count({ where: { outcome: VerdictOutcome.PENDING } });
    const accuracy = confirmed + wrong > 0 ? (confirmed / (confirmed + wrong)) * 100 : 0;

    return { total, confirmed, wrong, pending, accuracy: Math.round(accuracy) };
  }
}
