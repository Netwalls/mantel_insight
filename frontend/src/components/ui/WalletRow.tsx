'use client'

import { cn, formatAddress, formatTimeAgo, getWalletTagColor, getScoreColor } from '@/lib/utils'
import type { Wallet } from '@/types'

export function WalletRow({ wallet, onClick }: { wallet: Wallet; onClick?: () => void }) {
  const tagColor = getWalletTagColor(wallet.tag)
  const scoreColor = getScoreColor(wallet.score)

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-lg border border-border hover:border-border-bright hover:bg-surface-2 transition-all cursor-pointer',
        wallet.exitConviction >= 70 && 'border-accent-red/20 bg-accent-red/3',
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm text-text-primary">{formatAddress(wallet.address, 8)}</code>
          {wallet.exitConviction >= 70 && (
            <span className="text-xs text-accent-red font-mono animate-pulse">EXIT</span>
          )}
        </div>
        {wallet.aiExplanation && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{wallet.aiExplanation.slice(0, 80)}…</p>
        )}
      </div>

      <span className={cn('text-xs font-mono shrink-0', tagColor)}>{wallet.tag}</span>

      <div className="shrink-0 text-right w-10">
        <p className={cn('font-mono font-bold text-base leading-none', scoreColor)}>{wallet.score}</p>
        <p className="text-xs text-text-muted">score</p>
      </div>

      <div className="shrink-0 text-right w-12">
        <p className={cn(
          'font-mono font-bold text-base leading-none',
          wallet.exitConviction >= 70 ? 'text-accent-red' : wallet.exitConviction >= 40 ? 'text-accent-yellow' : 'text-text-muted',
        )}>{wallet.exitConviction}%</p>
        <p className="text-xs text-text-muted">exit</p>
      </div>
    </div>
  )
}
