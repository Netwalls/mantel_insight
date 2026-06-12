'use client'

import { useQuery } from '@tanstack/react-query'
import { FileCode, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { contractsApi, agentsApi } from '@/lib/api'
import { cn, formatTimeAgo } from '@/lib/utils'
import type { OnChainVerdict, AgentVerdict } from '@/types'

export default function ContractPage() {
  const { data: contractInfo } = useQuery({ queryKey: ['contract-info'], queryFn: contractsApi.getInfo })
  const { data: onChainVerdicts } = useQuery({ queryKey: ['on-chain-verdicts'], queryFn: contractsApi.getVerdicts, refetchInterval: 30_000 })
  const { data: agentVerdicts } = useQuery({ queryKey: ['agent-verdicts'], queryFn: agentsApi.getVerdicts, refetchInterval: 15_000 })
  const { data: verdictStats } = useQuery({ queryKey: ['verdict-stats'], queryFn: agentsApi.getVerdictStats })

  const outcomeIcon = (outcome: string) => {
    if (outcome === 'confirmed') return <CheckCircle size={14} className="text-accent-green" />
    if (outcome === 'wrong') return <XCircle size={14} className="text-accent-red" />
    return <Clock size={14} className="text-accent-yellow" />
  }

  const outcomeColor = (outcome: string) => {
    if (outcome === 'confirmed') return 'text-accent-green'
    if (outcome === 'wrong') return 'text-accent-red'
    return 'text-accent-yellow'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-bold text-text-primary flex items-center gap-3">
          <FileCode size={24} className="text-accent-purple" />
          On-Chain Verdict Explorer
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Every AI prediction stored permanently on Mantle Network
        </p>
      </div>

      {/* Contract info */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-text-muted uppercase mb-1">Smart Contract</p>
            <h2 className="font-mono font-bold text-text-primary">AlphaSightIntelligence.sol</h2>
          </div>
          <div className={cn('badge', contractInfo?.isLive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-yellow/10 text-accent-yellow')}>
            {contractInfo?.isLive ? 'LIVE' : 'DEMO MODE'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-mono text-text-muted mb-1">Contract Address</p>
            <code className="font-mono text-xs text-text-secondary break-all">{contractInfo?.address || 'Not deployed'}</code>
          </div>
          <div>
            <p className="text-xs font-mono text-text-muted mb-1">Network</p>
            <p className="font-mono text-sm text-text-primary">{contractInfo?.network} (Chain ID {contractInfo?.chainId})</p>
          </div>
        </div>

        {contractInfo?.isLive && (
          <a
            href={`${contractInfo.explorerUrl}/address/${contractInfo.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-accent-blue hover:underline"
          >
            <ExternalLink size={12} />
            View on Mantle Explorer
          </a>
        )}
      </div>

      {/* Verdict stats */}
      {verdictStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">{verdictStats.total}</p>
            <p className="text-xs text-text-muted font-mono mt-1">TOTAL VERDICTS</p>
          </div>
          <div className="card text-center">
            <p className="font-mono text-2xl font-bold text-accent-green">{verdictStats.confirmed}</p>
            <p className="text-xs text-text-muted font-mono mt-1">CONFIRMED</p>
          </div>
          <div className="card text-center">
            <p className="font-mono text-2xl font-bold text-accent-yellow">{verdictStats.pending}</p>
            <p className="text-xs text-text-muted font-mono mt-1">PENDING</p>
          </div>
          <div className="card text-center">
            <p className={cn('font-mono text-2xl font-bold', verdictStats.accuracy >= 70 ? 'text-accent-green' : 'text-accent-yellow')}>
              {verdictStats.accuracy}%
            </p>
            <p className="text-xs text-text-muted font-mono mt-1">ACCURACY</p>
          </div>
        </div>
      )}

      {/* On-chain verdicts table */}
      <div>
        <p className="section-title">On-Chain Verdicts</p>
        <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-border text-xs font-mono text-text-muted uppercase">
            <span>ID</span>
            <span>Signal Type</span>
            <span>Pool</span>
            <span>Confidence</span>
            <span className="text-right">Outcome</span>
          </div>
          <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
            {(onChainVerdicts || []).map((verdict: OnChainVerdict) => (
              <div key={verdict.id} className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-surface-3 transition-colors">
                <span className="font-mono text-xs text-text-muted">#{verdict.id}</span>
                <span className="font-mono text-xs text-text-secondary">{verdict.signalType}</span>
                <span className="font-mono text-xs text-text-secondary">{verdict.pool}</span>
                <div className="flex items-center gap-1">
                  <div className="w-12 bg-surface-3 rounded-full h-1">
                    <div
                      className="h-1 rounded-full bg-accent-green"
                      style={{ width: `${verdict.confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-text-secondary">{verdict.confidence}%</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  {outcomeIcon(verdict.outcome)}
                  <span className={cn('font-mono text-xs capitalize', outcomeColor(verdict.outcome))}>
                    {verdict.outcome}
                  </span>
                </div>
              </div>
            ))}
            {(!onChainVerdicts || onChainVerdicts.length === 0) && (
              <div className="p-8 text-center text-text-muted font-mono text-sm">
                No verdicts recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent verdicts */}
      <div>
        <p className="section-title">Recent Agent Verdicts</p>
        <div className="space-y-3">
          {(agentVerdicts || []).slice(0, 10).map((verdict: AgentVerdict) => (
            <div key={verdict.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-accent-green uppercase">{verdict.agentId}</span>
                  {outcomeIcon(verdict.outcome)}
                  <span className={cn('font-mono text-xs capitalize', outcomeColor(verdict.outcome))}>
                    {verdict.outcome}
                  </span>
                </div>
                <span className="text-xs font-mono text-text-muted">{formatTimeAgo(verdict.createdAt)}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{verdict.verdict}</p>
              {verdict.onChainTxHash && (
                <p className="text-xs font-mono text-accent-blue mt-2">
                  ✓ Stored on-chain
                </p>
              )}
            </div>
          ))}
          {(!agentVerdicts || agentVerdicts.length === 0) && (
            <div className="card text-center text-text-muted font-mono text-sm py-8">
              Agents are initializing...
            </div>
          )}
        </div>
      </div>

      {/* Smart contract source */}
      <div>
        <p className="section-title">Contract ABI Highlights</p>
        <div className="bg-surface-2 border border-border rounded-xl p-4 font-mono text-xs">
          <pre className="text-accent-green overflow-x-auto whitespace-pre-wrap">{`// SPDX-License-Identifier: MIT
// AlphaSightIntelligence.sol — Mantle Network

struct Verdict {
    string signalType;    // "Exit Warning" | "MEV Risk" | ...
    uint8 confidence;     // 0-100
    uint256 timestamp;    // block.timestamp
    string pool;          // "ETH/USDC" | ...
    address agentId;      // Agent identity address
    string outcome;       // "pending" | "confirmed" | "wrong"
}

function storeVerdict(
    string memory _signalType,
    uint8 _confidence,
    string memory _pool,
    address _agentId
) external onlyOwner returns (uint256);

function updateOutcome(uint256 _id, string memory _outcome) external onlyOwner;
function getVerdict(uint256 _id) external view returns (Verdict memory);
function totalVerdicts() external view returns (uint256);`}</pre>
        </div>
      </div>
    </div>
  )
}
