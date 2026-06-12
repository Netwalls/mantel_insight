'use client'

import { cn, formatTimeAgo, getAgentStatusColor } from '@/lib/utils'
import type { AgentStatusData } from '@/types'

const agentEmoji: Record<string, string> = {
  watcher: '🔍',
  hunter: '🎯',
  analyst: '🧠',
}

export function AgentStatusCard({ agent, className }: { agent: AgentStatusData; className?: string }) {
  const statusColor = getAgentStatusColor(agent.status)

  return (
    <div className={cn('card', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{agentEmoji[agent.id] || '🤖'}</span>
          <div>
            <p className="font-medium text-sm text-text-primary">{agent.name}</p>
            <p className="text-xs text-text-muted">{agent.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            agent.status === 'active' ? 'bg-accent-green live-indicator' :
            agent.status === 'processing' ? 'bg-accent-yellow live-indicator' :
            'bg-text-muted',
          )} />
          <span className={cn('text-xs font-mono', statusColor)}>{agent.status}</span>
        </div>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed mb-3 min-h-[2.5rem]">
        {agent.lastAction}
      </p>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span><span className="font-mono text-text-primary">{agent.verdictsTotal}</span> verdicts</span>
        {agent.verdictsPending > 0 && (
          <span><span className="font-mono text-accent-yellow">{agent.verdictsPending}</span> pending</span>
        )}
        <span className="font-mono">{formatTimeAgo(agent.lastActionTime)}</span>
      </div>
    </div>
  )
}
