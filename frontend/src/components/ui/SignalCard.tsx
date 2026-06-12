'use client'

import { cn, formatTimeAgo, getSignalColor, getRiskColor } from '@/lib/utils'
import type { Signal } from '@/types'

interface SignalCardProps {
  signal: Signal
  compact?: boolean
  className?: string
}

const riskDot: Record<string, string> = {
  high: 'bg-accent-red',
  medium: 'bg-accent-yellow',
  low: 'bg-accent-green',
}

export function SignalCard({ signal, compact = false, className }: SignalCardProps) {
  const signalColor = getSignalColor(signal.type)
  const riskColor = getRiskColor(signal.riskLevel)

  return (
    <div className={cn('card-hover slide-in', className)}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn('font-mono font-semibold text-sm', signalColor)}>
              {signal.type}
            </span>
            <span className={cn('flex items-center gap-1 text-xs', riskColor)}>
              <span className={cn('w-1.5 h-1.5 rounded-full inline-block', riskDot[signal.riskLevel] || 'bg-text-muted')} />
              {signal.riskLevel}
            </span>
          </div>
          {signal.pool && (
            <p className="text-xs text-text-muted font-mono">{signal.pool}</p>
          )}
        </div>
        <span className={cn(
          'font-mono font-bold text-lg leading-none shrink-0',
          signal.confidence >= 80 ? 'text-accent-green' : signal.confidence >= 60 ? 'text-accent-yellow' : 'text-accent-orange',
        )}>
          {signal.confidence}%
        </span>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-2">
        {signal.explanation}
      </p>

      {!compact && signal.action && (
        <p className="text-xs text-text-muted leading-relaxed mb-2 border-l-2 border-border pl-2">
          {signal.action}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted font-mono">{formatTimeAgo(signal.timestamp)}</span>
        {signal.onChainTxHash && (
          <span className="text-xs text-accent-green font-mono">on-chain ✓</span>
        )}
      </div>
    </div>
  )
}
