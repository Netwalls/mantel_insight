'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Wallet } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { cn } from '@/lib/utils'

const TICKER_ITEMS = [
  { label: 'exit warning', confidence: 87, text: '4 wallets pulling out of Merchant Moe ETH/USDC' },
  { label: 'mev spike', confidence: 92, text: 'Sandwich volume on Agni Finance up 340% in 6 hours' },
  { label: 'whale move', confidence: 95, text: '2.8M MNT bridged out — biggest single-day outflow this month' },
  { label: 'accumulation', confidence: 73, text: '3 tracked wallets quietly buying MNT near support' },
  { label: 'exit warning', confidence: 81, text: 'LP removal from MNT/USDC by 2 high-score wallets' },
]

const labelColors: Record<string, string> = {
  'exit warning': 'text-accent-red',
  'mev spike': 'text-accent-orange',
  'whale move': 'text-accent-blue',
  'accumulation': 'text-accent-green',
}

export default function LandingPage() {
  const { connect, isConnected, isLoading, address } = useWallet()
  const router = useRouter()
  const [tickerPos, setTickerPos] = useState(0)
  const [userConnected, setUserConnected] = useState(false)

  useEffect(() => {
    if (isConnected && userConnected) {
      const timer = setTimeout(() => router.push('/dashboard'), 500)
      return () => clearTimeout(timer)
    }
  }, [isConnected, userConnected, router])

  useEffect(() => {
    const id = setInterval(() => setTickerPos((p) => (p + 1) % (TICKER_ITEMS.length * 2)), 50)
    return () => clearInterval(id)
  }, [])

  const handleConnect = async () => {
    await connect()
    setUserConnected(true)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-100" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent-green/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/50">
        <span className="font-mono font-bold text-sm tracking-widest text-text-primary">ALPHASIGHT</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-indicator" />
            <span className="text-xs text-text-muted">Mantle Network</span>
          </div>
          <a href="#how" className="text-xs text-text-secondary hover:text-text-primary transition-colors">How it works</a>
        </div>
      </nav>

      {/* Live ticker */}
      <div className="relative z-10 border-b border-border/50 bg-surface/60 py-2 overflow-hidden">
        <div className="relative overflow-hidden h-5">
          <div
            className="flex gap-12 whitespace-nowrap absolute"
            style={{ transform: `translateX(-${tickerPos * 8}px)` }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((s, i) => (
              <span key={i} className="flex items-center gap-2 text-xs font-mono shrink-0">
                <span className={cn('font-semibold', labelColors[s.label] || 'text-text-secondary')}>{s.label}</span>
                <span className="text-text-muted">{s.confidence}%</span>
                <span className="text-text-secondary">— {s.text}</span>
                <span className="text-border-bright mx-4">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="flex items-center gap-2 mb-8 text-xs text-text-muted font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-indicator" />
          running on Mantle Network · chain ID 5000
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-mono mb-5 leading-none tracking-tight">
          <span className="text-gradient-green">ALPHA</span><span className="text-text-primary">SIGHT</span>
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary font-light mb-6 max-w-xl">
          Know what big wallets are doing before everyone else does.
        </p>
        <p className="text-base text-text-muted max-w-lg mx-auto leading-relaxed mb-12">
          We watch a set of high-signal wallets on Mantle 24/7. When they start moving out of a pool
          or a sandwich bot shows up, you get an alert — not after the fact.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          {isConnected && userConnected ? (
            <div className="flex items-center gap-3 px-8 py-4 rounded-xl border border-accent-green/30 bg-accent-green/5">
              <span className="w-2 h-2 rounded-full bg-accent-green" />
              <span className="font-mono text-accent-green text-sm">
                {address?.slice(0, 6)}…{address?.slice(-4)} connected
              </span>
              <span className="text-text-muted text-xs">opening dashboard…</span>
            </div>
          ) : isConnected ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="group flex items-center gap-3 font-mono font-semibold px-8 py-4 rounded-xl bg-accent-green text-background hover:bg-accent-green-dim transition-all duration-150 glow-green"
            >
              Open dashboard
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <>
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className={cn(
                  'group flex items-center gap-3 font-mono font-semibold px-8 py-4 rounded-xl text-sm transition-all duration-150',
                  isLoading
                    ? 'bg-surface-3 text-text-muted cursor-not-allowed'
                    : 'bg-accent-green text-background hover:bg-accent-green-dim glow-green',
                )}
              >
                <Wallet size={16} />
                {isLoading ? 'Connecting…' : 'Connect wallet'}
                {!isLoading && <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
              </button>
              <p className="text-xs text-text-muted">Works with MetaMask and any EVM wallet</p>
            </>
          )}
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-3 gap-10 mt-16 max-w-sm mx-auto">
          {[
            { value: '3', label: 'agents running' },
            { value: '7+', label: 'wallets tracked' },
            { value: '30s', label: 'refresh rate' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-mono font-bold text-xl text-accent-green">{s.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div id="how" className="relative z-10 border-t border-border px-8 py-16">
        <p className="text-center text-sm text-text-muted mb-10">How it works</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              step: '01',
              title: 'Wallet surveillance',
              desc: 'We track a curated set of wallets that have historically moved markets on Mantle. Every 30 seconds we check what they\'re doing.',
            },
            {
              step: '02',
              title: 'Pattern detection',
              desc: 'When multiple tracked wallets start pulling liquidity from the same pool, or a sandwich bot starts targeting a DEX pair, we flag it.',
            },
            {
              step: '03',
              title: 'Stored on-chain',
              desc: 'Every alert we generate gets a verdict written to a Mantle smart contract. You can verify our track record directly on the explorer.',
            },
          ].map((f) => (
            <div key={f.step} className="card border-border/60">
              <p className="font-mono text-xs text-text-muted mb-3">{f.step}</p>
              <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Agent row */}
      <div className="relative z-10 border-t border-border px-8 py-14 bg-surface/30">
        <p className="text-center text-sm text-text-muted mb-8">Three background processes, always on</p>
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { name: 'Watcher', desc: 'Scans wallet activity every 30 seconds and builds exit sequences.' },
            { name: 'Hunter', desc: 'Picks up on MEV patterns correlated with whale movement.' },
            { name: 'Analyst', desc: 'Combines both signals, runs a confidence score, writes the verdict on-chain.' },
          ].map((a) => (
            <div key={a.name} className="card">
              <p className="font-mono font-semibold text-sm text-accent-green mb-1">{a.name}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-border px-8 py-10 text-center">
        {!isConnected && (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="font-mono font-semibold px-6 py-3 rounded-lg bg-accent-green text-background hover:bg-accent-green-dim transition-colors text-sm mb-6"
          >
            {isLoading ? 'Connecting…' : 'Get started →'}
          </button>
        )}
        <p className="text-xs text-text-muted">Built on Mantle Network · Hackathon 2024</p>
      </div>
    </div>
  )
}
