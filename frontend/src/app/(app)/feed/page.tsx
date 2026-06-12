'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Filter } from 'lucide-react'
import { signalsApi } from '@/lib/api'
import { SignalCard } from '@/components/ui/SignalCard'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { Signal, SignalType, RiskLevel } from '@/types'
import { cn } from '@/lib/utils'

const SIGNAL_TYPES: SignalType[] = ['Exit Warning', 'MEV Risk', 'Whale Alert', 'Accumulation', 'Bullish', 'Bearish']
const RISK_LEVELS: RiskLevel[] = ['critical', 'high', 'medium', 'low']

export default function FeedPage() {
  const [liveSignals, setLiveSignals] = useState<Signal[]>([])
  const [typeFilter, setTypeFilter] = useState<SignalType | 'all'>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')

  const { data: signals, isLoading } = useQuery({
    queryKey: ['signals-feed'],
    queryFn: () => signalsApi.getAll(50),
    refetchInterval: 15_000,
  })

  useWebSocket<Signal>('signal:new', (signal) => {
    setLiveSignals((prev) => [signal, ...prev].slice(0, 30))
  }, 'subscribe:feed')

  const allSignals = [...liveSignals, ...(signals || [])].filter((s, i, arr) =>
    arr.findIndex((x) => x.id === s.id) === i,
  )

  const filtered = allSignals
    .filter((s) => typeFilter === 'all' || s.type === typeFilter)
    .filter((s) => riskFilter === 'all' || s.riskLevel === riskFilter)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold text-text-primary">Alpha Discovery Feed</h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time AI-generated signals from the Mantle ecosystem
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-green live-indicator" />
          <span className="text-xs font-mono text-text-muted">{filtered.length} signals</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <span className="text-xs font-mono text-text-muted">TYPE:</span>
        </div>
        {(['all', ...SIGNAL_TYPES] as const).map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={cn(
              'text-xs font-mono px-3 py-1.5 rounded-lg border transition-all',
              typeFilter === type
                ? 'border-accent-green/40 bg-accent-green/10 text-accent-green'
                : 'border-border text-text-muted hover:border-border-bright hover:text-text-secondary',
            )}
          >
            {type === 'all' ? 'ALL' : type.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted">RISK:</span>
        </div>
        {(['all', ...RISK_LEVELS] as const).map((level) => (
          <button
            key={level}
            onClick={() => setRiskFilter(level)}
            className={cn(
              'text-xs font-mono px-3 py-1.5 rounded-lg border transition-all',
              riskFilter === level
                ? 'border-accent-yellow/40 bg-accent-yellow/10 text-accent-yellow'
                : 'border-border text-text-muted hover:border-border-bright',
            )}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48 bg-surface-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted font-mono">
          No signals match the current filters
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}
    </div>
  )
}
