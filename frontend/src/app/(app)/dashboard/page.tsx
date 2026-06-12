'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { signalsApi, walletsApi, mevApi, agentsApi } from '@/lib/api'
import { SignalCard } from '@/components/ui/SignalCard'
import { useMultipleWebSocket } from '@/hooks/useWebSocket'
import type { Signal, AgentStatusData } from '@/types'
import { cn, formatTimeAgo, getAgentStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

const agentEmoji: Record<string, string> = { watcher: '🔍', hunter: '🎯', analyst: '🧠' }

export default function DashboardPage() {
  const [liveSignals, setLiveSignals] = useState<Signal[]>([])
  const [liveAgents, setLiveAgents] = useState<AgentStatusData[]>([])

  const { data: signals } = useQuery({ queryKey: ['signals'], queryFn: () => signalsApi.getAll(4) })
  const { data: walletStats } = useQuery({ queryKey: ['walletStats'], queryFn: walletsApi.getStats })
  const { data: mevStats } = useQuery({ queryKey: ['mevStats'], queryFn: mevApi.getStats })
  const { data: agentStatuses } = useQuery({ queryKey: ['agentStatuses'], queryFn: agentsApi.getStatuses })

  useMultipleWebSocket(
    [
      {
        event: 'signal:new',
        handler: (signal: Signal) => {
          setLiveSignals((prev) => [signal, ...prev].slice(0, 4))
          toast(`${signal.type} — ${signal.confidence}%`, { icon: '📡' })
        },
      },
      {
        event: 'agent:status',
        handler: (status: AgentStatusData) => {
          setLiveAgents((prev) => {
            const rest = prev.filter((a) => a.id !== status.id)
            return [status, ...rest]
          })
        },
      },
    ],
    'subscribe:dashboard',
  )

  const displaySignals = liveSignals.length > 0 ? liveSignals : (signals || [])
  const displayAgents = liveAgents.length > 0 ? liveAgents : (agentStatuses || [])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="stat-label mb-1.5">Watcher wallets</p>
          <p className="font-mono text-xl font-bold text-accent-green">
            {walletStats?.smartMoneyWallets || 0}
            <span className="text-sm text-text-muted font-normal ml-1">/ {walletStats?.totalWallets || 0}</span>
          </p>
        </div>
        <div className="card">
          <p className="stat-label mb-1.5">Signals today</p>
          <p className="font-mono text-xl font-bold text-text-primary">
            {walletStats?.recentEvents24h || 0}
            <span className="text-sm text-text-muted font-normal ml-1">events</span>
          </p>
        </div>
        <div className="card">
          <p className="stat-label mb-1.5">MEV attacks (24h)</p>
          <p className={cn('font-mono text-xl font-bold', (mevStats?.totalEvents24h || 0) > 10 ? 'text-accent-red' : 'text-accent-yellow')}>
            {mevStats?.totalEvents24h || 0}
          </p>
        </div>
      </div>

      {/* Agents — compact strip */}
      <div>
        <p className="section-title">Agents</p>
        <div className="card divide-y divide-border/50 p-0 overflow-hidden">
          {displayAgents.length > 0 ? displayAgents.map((agent: AgentStatusData) => (
            <div key={agent.id} className="flex items-center gap-4 px-4 py-3">
              <span className="text-base w-5 shrink-0">{agentEmoji[agent.id] || '🤖'}</span>
              <div className="w-28 shrink-0">
                <p className="text-sm font-medium text-text-primary">{agent.name}</p>
              </div>
              <p className="flex-1 text-xs text-text-muted truncate">{agent.lastAction}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  agent.status === 'active' ? 'bg-accent-green live-indicator' :
                  agent.status === 'processing' ? 'bg-accent-yellow live-indicator' :
                  'bg-text-muted',
                )} />
                <span className={cn('text-xs font-mono', getAgentStatusColor(agent.status))}>{agent.status}</span>
              </div>
              <span className="text-xs text-text-muted font-mono w-16 text-right shrink-0">
                {formatTimeAgo(agent.lastActionTime)}
              </span>
            </div>
          )) : (
            [0,1,2].map((i) => (
              <div key={i} className="h-12 animate-pulse bg-surface-2" />
            ))
          )}
        </div>
      </div>

      {/* Recent signals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title mb-0">Latest signals</p>
          <a href="/feed" className="text-xs text-accent-green hover:text-accent-green-dim transition-colors">
            View all →
          </a>
        </div>
        <div className="space-y-3">
          {displaySignals.slice(0, 4).map((signal: Signal) => (
            <SignalCard key={signal.id} signal={signal} compact />
          ))}
          {displaySignals.length === 0 && (
            [0,1,2].map((i) => (
              <div key={i} className="card animate-pulse h-20 bg-surface-2" />
            ))
          )}
        </div>
      </div>

    </div>
  )
}
