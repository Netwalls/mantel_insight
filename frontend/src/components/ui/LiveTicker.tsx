'use client'

import { useEffect, useState } from 'react'
import { cn, getSignalIcon, getSignalColor } from '@/lib/utils'
import type { Signal } from '@/types'
import { useWebSocket } from '@/hooks/useWebSocket'

interface LiveTickerProps {
  initialSignals?: Signal[]
}

export function LiveTicker({ initialSignals = [] }: LiveTickerProps) {
  const [signals, setSignals] = useState<Signal[]>(initialSignals)

  useWebSocket<Signal>('signal:new', (signal) => {
    setSignals((prev) => [signal, ...prev].slice(0, 20))
  })

  if (signals.length === 0) return null

  const tickerContent = [...signals, ...signals] // duplicate for seamless loop

  return (
    <div className="w-full overflow-hidden bg-surface-2 border-y border-border py-2 relative">
      <div className="flex items-center gap-2 mb-1 px-4">
        <span className="w-2 h-2 rounded-full bg-accent-green live-indicator" />
        <span className="text-xs font-mono text-text-muted uppercase tracking-widest">Live Signal Feed</span>
      </div>

      <div className="flex overflow-hidden">
        <div className="flex gap-8 animate-ticker whitespace-nowrap">
          {tickerContent.map((signal, i) => {
            const icon = getSignalIcon(signal.type)
            const color = getSignalColor(signal.type)
            return (
              <span key={`${signal.id}-${i}`} className="flex items-center gap-2 text-sm font-mono shrink-0">
                <span>{icon}</span>
                <span className={cn('font-bold', color)}>{signal.type.toUpperCase()}</span>
                <span className="text-text-muted">{signal.confidence}%</span>
                <span className="text-text-secondary">{signal.explanation.slice(0, 60)}...</span>
                <span className="text-border-bright mx-2">|</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
