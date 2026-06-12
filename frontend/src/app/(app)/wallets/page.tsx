'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { walletsApi } from '@/lib/api'
import { WalletRow } from '@/components/ui/WalletRow'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { Wallet } from '@/types'
import { cn, formatAddress, formatTimeAgo, getWalletTagColor, getScoreColor, getRiskColor } from '@/lib/utils'

export default function WalletsPage() {
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [liveWallets, setLiveWallets] = useState<Map<string, Partial<Wallet>>>(new Map())

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.getAll(50),
    refetchInterval: 30_000,
  })

  const { data: exitingWallets } = useQuery({
    queryKey: ['wallets-exiting'],
    queryFn: walletsApi.getExiting,
    refetchInterval: 15_000,
  })

  useWebSocket<{ wallet: Wallet }>('wallet:event', ({ wallet }) => {
    setLiveWallets((prev) => {
      const updated = new Map(prev)
      updated.set(wallet.address, { ...updated.get(wallet.address), ...wallet })
      return updated
    })
  })

  const displayWallets = wallets?.map((w: Wallet) => ({
    ...w,
    ...(liveWallets.get(w.address) || {}),
  })) || []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold text-text-primary">Watcher Wallets</h1>
          <p className="text-text-secondary text-sm mt-1">
            Tracking {displayWallets.length} wallets on Mantle
          </p>
        </div>
      </div>

      {/* Exiting wallets alert */}
      {exitingWallets && exitingWallets.length > 0 && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-accent-red" />
            <span className="font-mono font-bold text-accent-red text-sm">
              EXIT SEQUENCES DETECTED — {exitingWallets.length} wallets exiting
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {exitingWallets.slice(0, 5).map((w: Wallet) => (
              <button
                key={w.id}
                onClick={() => setSelectedWallet(w)}
                className="font-mono text-xs bg-accent-red/20 text-accent-red px-3 py-1 rounded-lg hover:bg-accent-red/30"
              >
                {formatAddress(w.address)} — {w.exitConviction}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table header */}
      <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-border text-xs font-mono text-text-muted uppercase">
          <span className="col-span-2">Wallet / Last Action</span>
          <span>Tag</span>
          <span className="text-center">Score</span>
          <span className="text-right">Exit Conviction</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-3 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {displayWallets.map((wallet: Wallet) => (
              <WalletRow
                key={wallet.id}
                wallet={wallet}
                onClick={() => setSelectedWallet(wallet)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Wallet detail drawer */}
      {selectedWallet && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-start justify-between">
              <div>
                <code className="font-mono text-sm text-text-primary">{selectedWallet.address}</code>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn('badge', getWalletTagColor(selectedWallet.tag))}>
                    {selectedWallet.tag}
                  </span>
                  {selectedWallet.exitConviction >= 70 && (
                    <span className="badge bg-accent-red/20 text-accent-red border border-accent-red/30">
                      EXITING
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedWallet(null)}
                className="text-text-muted hover:text-text-primary text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card text-center">
                  <p className={cn('font-mono text-3xl font-bold', getScoreColor(selectedWallet.score))}>
                    {selectedWallet.score}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Wallet score</p>
                </div>
                <div className="card text-center">
                  <p className={cn('font-mono text-3xl font-bold', selectedWallet.exitConviction >= 70 ? 'text-accent-red' : 'text-accent-yellow')}>
                    {selectedWallet.exitConviction}%
                  </p>
                  <p className="text-xs text-text-muted mt-1">Exit conviction</p>
                </div>
              </div>

              {/* AI Explanation */}
              {selectedWallet.aiExplanation && (
                <div className="bg-surface-2 rounded-xl p-4">
                  <p className="text-xs text-text-muted mb-2">AI analysis</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {selectedWallet.aiExplanation}
                  </p>
                </div>
              )}

              {/* Recent Events */}
              {selectedWallet.events && selectedWallet.events.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-3">Recent activity</p>
                  <div className="space-y-2">
                    {selectedWallet.events.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2">
                        <span className="font-mono text-xs text-accent-green uppercase">{event.eventType}</span>
                        {event.pool && <span className="text-xs text-text-muted">{event.pool}</span>}
                        <span className="text-xs text-text-muted">{formatTimeAgo(event.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <a
                href={`https://explorer.mantle.xyz/address/${selectedWallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs font-mono text-accent-blue hover:underline"
              >
                View on Mantle Explorer →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
