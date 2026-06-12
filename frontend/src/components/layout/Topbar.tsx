'use client'

import { Menu, Cpu, Wallet } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { cn } from '@/lib/utils'

interface TopbarProps {
  onMenuClick: () => void
  title?: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { address, isMantle } = useWallet()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-surface/90 backdrop-blur-md border-b border-border">
      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent-green/20 border border-accent-green/30 flex items-center justify-center">
            <Cpu size={12} className="text-accent-green" />
          </div>
          <span className="font-mono font-bold text-xs tracking-widest text-text-primary hidden sm:block">
            ALPHASIGHT AI
          </span>
        </div>

        {title && (
          <>
            <span className="text-border-bright">/</span>
            <span className="font-mono text-xs text-text-secondary">{title}</span>
          </>
        )}
      </div>

      {/* Right: live status + wallet */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-indicator" />
          <span className="font-mono text-xs text-text-muted">LIVE</span>
        </div>

        {address && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-1.5 border',
            isMantle ? 'bg-accent-green/5 border-accent-green/20' : 'bg-accent-yellow/5 border-accent-yellow/20',
          )}>
            <Wallet size={12} className={isMantle ? 'text-accent-green' : 'text-accent-yellow'} />
            <code className={cn('font-mono text-xs hidden sm:block', isMantle ? 'text-accent-green' : 'text-accent-yellow')}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </code>
            <span className={cn('w-1.5 h-1.5 rounded-full sm:hidden', isMantle ? 'bg-accent-green' : 'bg-accent-yellow')} />
          </div>
        )}
      </div>
    </header>
  )
}
