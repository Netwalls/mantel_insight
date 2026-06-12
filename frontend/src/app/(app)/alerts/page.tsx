'use client'

import { useState } from 'react'
import { Check, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AlertCategory {
  id: string
  emoji: string
  label: string
  description: string
  enabled: boolean
}

export default function AlertsPage() {
  const [categories, setCategories] = useState<AlertCategory[]>([
    {
      id: 'whale',
      emoji: '🐳',
      label: 'Whale Movements',
      description: 'Alert when tracked wallets make large moves',
      enabled: true,
    },
    {
      id: 'mev',
      emoji: '⚠️',
      label: 'MEV Risk Warnings',
      description: 'Alert when sandwich attack volume spikes on monitored pools',
      enabled: true,
    },
    {
      id: 'exit',
      emoji: '🚨',
      label: 'Exit Sequences',
      description: 'Alert when watcher wallets begin coordinated exit from LP positions',
      enabled: true,
    },
    {
      id: 'accumulation',
      emoji: '🟢',
      label: 'Accumulation Signals',
      description: 'Alert when high-score wallets quietly accumulate positions',
      enabled: false,
    },
  ])

  const [telegramChatId, setTelegramChatId] = useState('')
  const [botToken, setBotToken] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c),
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    // In production this would save to the backend
    await new Promise((r) => setTimeout(r, 1000))
    setIsSaving(false)
    toast.success('Alert settings saved!')
  }

  const enabledCount = categories.filter((c) => c.enabled).length

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-mono font-bold text-text-primary">Alert Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          Configure your real-time alert subscriptions
        </p>
      </div>

      {/* Telegram setup */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
            <MessageCircle size={20} className="text-accent-blue" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-sm text-text-primary">Telegram Bot Setup</h2>
            <p className="text-xs text-text-muted">Receive instant alerts via Telegram</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-text-muted uppercase mb-2">
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Your Telegram chat ID (e.g. 123456789)"
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-accent-green/40 transition-colors"
            />
          </div>

          <div className="bg-surface-3 rounded-xl p-4">
            <p className="text-xs font-mono text-text-muted mb-2">How to get your Chat ID:</p>
            <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
              <li>Search for <code className="text-accent-green">@AlphaSightAI_bot</code> on Telegram</li>
              <li>Send <code className="text-accent-green">/start</code></li>
              <li>Your Chat ID will be confirmed automatically</li>
            </ol>
          </div>

          <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4">
            <p className="text-xs font-mono text-accent-green mb-1">Bot Commands</p>
            <div className="grid grid-cols-2 gap-1 text-xs font-mono text-text-muted">
              {['/start', '/status', '/feed', '/subscribe [category]'].map((cmd) => (
                <code key={cmd} className="bg-surface-3 px-2 py-1 rounded">{cmd}</code>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alert categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title mb-0">Alert Categories</p>
          <span className="text-xs font-mono text-text-muted">
            {enabledCount}/{categories.length} active
          </span>
        </div>

        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border transition-all',
                category.enabled
                  ? 'border-accent-green/20 bg-accent-green/5'
                  : 'border-border bg-surface',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.emoji}</span>
                <div>
                  <p className="font-mono text-sm font-medium text-text-primary">{category.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{category.description}</p>
                </div>
              </div>

              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'w-12 h-6 rounded-full border transition-all duration-200 relative',
                  category.enabled
                    ? 'bg-accent-green border-accent-green'
                    : 'bg-surface-3 border-border',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-background transition-all duration-200',
                    category.enabled ? 'left-6' : 'left-0.5',
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sample alert preview */}
      <div>
        <p className="section-title">Alert Format Preview</p>
        <div className="bg-surface-2 border border-border rounded-xl p-5 font-mono text-sm">
          <div className="text-accent-red font-bold mb-2">🚨 EXIT WARNING — CRITICAL</div>
          <div className="text-text-secondary space-y-1">
            <p><span className="text-text-muted">Pool:</span> Merchant Moe ETH/USDC</p>
            <p><span className="text-text-muted">Wallets Exiting:</span> 4 watcher wallets</p>
            <p><span className="text-text-muted">Exit Started:</span> 2 hours ago</p>
            <p><span className="text-text-muted">MEV Risk:</span> <span className="text-accent-orange">ELEVATED</span></p>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-text-muted text-xs mb-1">AI Insight:</p>
            <p className="text-text-secondary text-xs leading-relaxed">
              "High conviction exit detected. MEV bot activity already increasing on this pool. Historical accuracy of this pattern: 78%"
            </p>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-accent-green text-xs">Confidence: 87%</span>
            <span className="text-accent-blue text-xs">[View on Dashboard →]</span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={cn(
          'w-full py-3 rounded-xl font-mono font-bold text-sm transition-all',
          isSaving
            ? 'bg-surface-3 text-text-muted cursor-not-allowed'
            : 'bg-accent-green text-background hover:bg-accent-green-dim',
        )}
      >
        {isSaving ? 'Saving...' : (
          <span className="flex items-center justify-center gap-2">
            <Check size={16} />
            Save Alert Settings
          </span>
        )}
      </button>
    </div>
  )
}
