export type WalletTag = 'Watcher' | 'MEV Bot' | 'Yield Farmer' | 'Scammer' | 'Accumulator' | 'Distributor' | 'Unknown'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type SignalType = 'Bullish' | 'Bearish' | 'MEV Risk' | 'Whale Alert' | 'Exit Warning' | 'Accumulation'
export type AgentId = 'watcher' | 'hunter' | 'analyst'
export type AgentStatus = 'active' | 'idle' | 'processing'
export type VerdictOutcome = 'pending' | 'confirmed' | 'wrong'
export type MevAttackType = 'sandwich' | 'frontrun' | 'arbitrage' | 'backrun' | 'liquidation'

export interface Wallet {
  id: string
  address: string
  score: number
  tag: WalletTag
  exitConviction: number
  totalValueUsd: number
  lastActive: string
  isWatched: boolean
  aiExplanation: string | null
  events?: WalletEvent[]
  createdAt: string
  updatedAt: string
}

export interface WalletEvent {
  id: string
  walletId: string
  eventType: string
  amount: number
  amountUsd: number
  pool: string | null
  token: string | null
  txHash: string | null
  blockNumber: number
  timestamp: string
}

export interface MevEvent {
  id: string
  pool: string
  attackType: MevAttackType
  gasSpike: number
  profitUsd: number
  attackerAddress: string
  riskLevel: RiskLevel
  correlationScore: number
  blockNumber: number
  timestamp: string
}

export interface Signal {
  id: string
  type: SignalType
  confidence: number
  riskLevel: RiskLevel
  explanation: string
  action: string | null
  pool: string | null
  onChainTxHash: string | null
  evidence: Record<string, unknown> | null
  telegramSent: boolean
  timestamp: string
}

export interface AgentStatusData {
  id: AgentId
  name: string
  role: string
  status: AgentStatus
  lastAction: string
  lastActionTime: string
  verdictsTotal: number
  verdictsPending: number
}

export interface AgentVerdict {
  id: string
  agentId: AgentId
  signalId: string | null
  verdict: string
  outcome: VerdictOutcome
  onChainTxHash: string | null
  onChainVerdictId: number | null
  createdAt: string
  updatedAt: string
}

export interface OnChainVerdict {
  id: number
  signalType: string
  confidence: number
  timestamp: number
  pool: string
  agentId: string
  outcome: string
  txHash: string
}

export interface EcosystemStats {
  totalWallets: number
  smartMoneyWallets: number
  mevBots: number
  recentEvents24h: number
}

export interface MevStats {
  totalEvents24h: number
  byType: Record<string, number>
  byPool: Record<string, number>
  totalProfitUsd: number
  mostTargetedPool: string
}

export interface PoolRisk {
  riskScore: number
  attackCount: number
  riskLevel: RiskLevel
}
