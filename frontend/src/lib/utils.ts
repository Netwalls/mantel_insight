import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import type { RiskLevel, SignalType, WalletTag } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, chars = 6): string {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-4)}`
}

export function formatUsd(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toFixed(2)}`
}

export function formatTimeAgo(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function getRiskColor(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: 'text-accent-green',
    medium: 'text-accent-yellow',
    high: 'text-accent-orange',
    critical: 'text-accent-red',
  }
  return map[risk] || 'text-text-secondary'
}

export function getRiskBgColor(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: 'bg-accent-green/10 border-accent-green/30',
    medium: 'bg-accent-yellow/10 border-accent-yellow/30',
    high: 'bg-accent-orange/10 border-accent-orange/30',
    critical: 'bg-accent-red/10 border-accent-red/30',
  }
  return map[risk] || 'bg-surface-2 border-border'
}

export function getSignalIcon(type: SignalType): string {
  const map: Record<SignalType, string> = {
    'Exit Warning': '🚨',
    'MEV Risk': '⚠️',
    'Whale Alert': '🐳',
    'Accumulation': '🟢',
    'Bullish': '📈',
    'Bearish': '📉',
  }
  return map[type] || '📡'
}

export function getSignalColor(type: SignalType): string {
  const map: Record<SignalType, string> = {
    'Exit Warning': 'text-accent-red',
    'MEV Risk': 'text-accent-orange',
    'Whale Alert': 'text-accent-blue',
    'Accumulation': 'text-accent-green',
    'Bullish': 'text-accent-green',
    'Bearish': 'text-accent-red',
  }
  return map[type] || 'text-text-secondary'
}

export function getWalletTagColor(tag: WalletTag): string {
  const map: Record<WalletTag, string> = {
    'Watcher': 'text-accent-green bg-accent-green/10',
    'MEV Bot': 'text-accent-red bg-accent-red/10',
    'Yield Farmer': 'text-accent-yellow bg-accent-yellow/10',
    'Scammer': 'text-accent-red bg-accent-red/20',
    'Accumulator': 'text-accent-blue bg-accent-blue/10',
    'Distributor': 'text-accent-orange bg-accent-orange/10',
    'Unknown': 'text-text-secondary bg-surface-3',
  }
  return map[tag] || 'text-text-secondary bg-surface-3'
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-accent-green'
  if (score >= 60) return 'text-accent-yellow'
  if (score >= 40) return 'text-accent-orange'
  return 'text-accent-red'
}

export function getAgentStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'text-accent-green',
    processing: 'text-accent-yellow',
    idle: 'text-text-secondary',
  }
  return map[status] || 'text-text-secondary'
}

export function truncateExplanation(text: string, maxLength = 120): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}
