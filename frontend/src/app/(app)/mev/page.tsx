'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { mevApi } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { cn, formatTimeAgo, getRiskColor, getRiskBgColor } from '@/lib/utils'
import type { MevEvent, PoolRisk } from '@/types'

export default function MevPage() {
  const [liveEvents, setLiveEvents] = useState<MevEvent[]>([])

  const { data: recentEvents } = useQuery({ queryKey: ['mev-events'], queryFn: () => mevApi.getRecent(30), refetchInterval: 15_000 })
  const { data: mevStats } = useQuery({ queryKey: ['mev-stats-full'], queryFn: mevApi.getStats, refetchInterval: 30_000 })
  const { data: poolRisks } = useQuery({ queryKey: ['pool-risks'], queryFn: mevApi.getPoolRisks, refetchInterval: 30_000 })
  const { data: mevSummary } = useQuery({ queryKey: ['mev-summary'], queryFn: mevApi.getSummary, refetchInterval: 30_000 })

  useWebSocket<MevEvent>('mev:event', (event) => {
    setLiveEvents((prev) => [event, ...prev].slice(0, 20))
  })

  const displayEvents = [...liveEvents, ...(recentEvents || [])].filter((e, i, arr) =>
    arr.findIndex((x) => x.id === e.id) === i,
  ).slice(0, 30)

  const attackTypeColors: Record<string, string> = {
    sandwich: 'text-accent-red',
    frontrun: 'text-accent-orange',
    arbitrage: 'text-accent-yellow',
    backrun: 'text-accent-blue',
    liquidation: 'text-accent-purple',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-mono font-bold text-text-primary">MEV Detection Radar</h1>
          <p className="text-text-secondary text-sm mt-1">
            Sandwich attacks, frontrunning, and arbitrage across Mantle DEXs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-yellow live-indicator" />
          <span className="text-xs font-mono text-text-muted">
            {mevStats?.totalEvents24h || 0} attacks in 24h
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="stat-label mb-2">Attacks (24h)</p>
          <p className="font-mono text-2xl font-bold text-accent-red">{mevStats?.totalEvents24h || 0}</p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Extracted value</p>
          <p className="font-mono text-2xl font-bold text-accent-orange">
            ${(mevStats?.totalProfitUsd || 0).toFixed(0)}
          </p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Most targeted pool</p>
          <p className="font-mono text-lg font-bold text-accent-yellow leading-tight">
            {mevStats?.mostTargetedPool || 'N/A'}
          </p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Dominant attack</p>
          <p className="font-mono text-xl font-bold text-text-primary">
            {mevSummary?.dominantAttackType || 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pool Risk Scores */}
        <div>
          <p className="section-title">Pool Risk Scores</p>
          {poolRisks && Object.keys(poolRisks).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(poolRisks as Record<string, PoolRisk>)
                .sort(([, a], [, b]) => b.riskScore - a.riskScore)
                .map(([pool, risk]) => (
                  <div key={pool} className={cn('card border', getRiskBgColor(risk.riskLevel))}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-text-primary">{pool}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-mono', getRiskColor(risk.riskLevel))}>
                          {risk.riskLevel}
                        </span>
                        <span className={cn('font-mono font-bold', getRiskColor(risk.riskLevel))}>
                          {risk.riskScore}/100
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-3 rounded-full h-2">
                      <div
                        className={cn('h-2 rounded-full', risk.riskScore >= 75 ? 'bg-accent-red' : risk.riskScore >= 50 ? 'bg-accent-orange' : risk.riskScore >= 25 ? 'bg-accent-yellow' : 'bg-accent-green')}
                        style={{ width: `${risk.riskScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted font-mono mt-2">{risk.attackCount} attacks tracked</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="card animate-pulse h-40 bg-surface-2" />
          )}
        </div>

        {/* Attack type breakdown */}
        <div>
          <p className="section-title">Attack Type Breakdown</p>
          {mevStats?.byType && Object.keys(mevStats.byType).length > 0 ? (
            <div className="card space-y-4">
              {Object.entries(mevStats.byType)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([type, count]: any) => {
                  const maxCount = Math.max(...Object.values(mevStats.byType) as number[])
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn('font-mono text-sm font-medium uppercase', attackTypeColors[type] || 'text-text-secondary')}>
                          {type}
                        </span>
                        <span className="font-mono text-sm text-text-secondary">{count} events</span>
                      </div>
                      <div className="w-full bg-surface-3 rounded-full h-2">
                        <div
                          className={cn('h-2 rounded-full', attackTypeColors[type]?.replace('text-', 'bg-') || 'bg-text-secondary')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="card animate-pulse h-40 bg-surface-2" />
          )}
        </div>
      </div>

      {/* Recent MEV Events */}
      <div>
        <p className="section-title">Recent MEV Events</p>
        <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-border text-xs font-mono text-text-muted uppercase">
            <span>Pool</span>
            <span>Attack Type</span>
            <span>Gas Spike</span>
            <span>Profit</span>
            <span className="text-right">Time</span>
          </div>
          <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
            {displayEvents.map((event) => (
              <div key={event.id} className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-surface-3 transition-colors">
                <span className="font-mono text-sm text-text-secondary">{event.pool}</span>
                <span className={cn('font-mono text-xs uppercase', attackTypeColors[event.attackType] || 'text-text-muted')}>
                  {event.attackType}
                </span>
                <span className="font-mono text-sm text-accent-yellow">{Number(event.gasSpike).toFixed(0)} Gwei</span>
                <span className="font-mono text-sm text-accent-green">${Number(event.profitUsd).toFixed(0)}</span>
                <span className="font-mono text-xs text-text-muted text-right">{formatTimeAgo(event.timestamp)}</span>
              </div>
            ))}
            {displayEvents.length === 0 && (
              <div className="p-8 text-center text-text-muted font-mono text-sm">
                Monitoring for MEV activity...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
