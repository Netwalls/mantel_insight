'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity, BarChart2, Eye, Zap, MessageSquare, Bell,
  FileCode, Cpu, LogOut, Wallet, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWallet } from '@/context/WalletContext'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/feed', label: 'Alpha Feed', icon: Activity },
  { href: '/wallets', label: 'Watcher Wallets', icon: Eye },
  { href: '/mev', label: 'MEV Radar', icon: Zap },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/contract', label: 'On-Chain', icon: FileCode },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { address, isMantle, disconnect } = useWallet()

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col z-50 transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo + close */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-green/20 border border-accent-green/40 flex items-center justify-center shrink-0">
              <Cpu size={16} className="text-accent-green" />
            </div>
            <div>
              <h1 className="font-mono font-bold text-sm text-text-primary tracking-wider">ALPHASIGHT</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-indicator" />
                <p className="text-xs text-accent-green font-mono">AI // MANTLE</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  isActive
                    ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
                )}
              >
                <Icon size={16} />
                <span className="font-medium">{label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-green" />}
              </Link>
            )
          })}
        </nav>

        {/* Wallet footer */}
        <div className="p-4 border-t border-border space-y-3">
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 border',
            isMantle ? 'bg-accent-green/5 border-accent-green/20' : 'bg-accent-yellow/5 border-accent-yellow/20',
          )}>
            <span className={cn('w-2 h-2 rounded-full shrink-0', isMantle ? 'bg-accent-green' : 'bg-accent-yellow live-indicator')} />
            <span className={cn('text-xs font-mono', isMantle ? 'text-accent-green' : 'text-accent-yellow')}>
              {isMantle ? 'Mantle Mainnet' : 'Wrong Network'}
            </span>
          </div>

          {address && (
            <div className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Wallet size={12} className="text-text-muted shrink-0" />
                <code className="text-xs font-mono text-text-secondary truncate">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </code>
              </div>
              <button
                onClick={disconnect}
                className="text-text-muted hover:text-accent-red transition-colors ml-2 shrink-0"
                title="Disconnect"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}

          <p className="text-xs text-text-muted font-mono text-center">Hackathon MVP v1.0</p>
        </div>
      </aside>
    </>
  )
}
