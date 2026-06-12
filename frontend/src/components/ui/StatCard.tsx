import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'default'
  className?: string
}

const colorMap = {
  green: 'text-accent-green',
  red: 'text-accent-red',
  yellow: 'text-accent-yellow',
  blue: 'text-accent-blue',
  default: 'text-text-primary',
}

export function StatCard({
  label, value, subValue, trend, trendValue, color = 'default', className,
}: StatCardProps) {
  return (
    <div className={cn('card', className)}>
      <p className="stat-label mb-2">{label}</p>
      <p className={cn('font-mono text-2xl font-bold leading-none', colorMap[color])}>{value}</p>
      <div className="flex items-center justify-between mt-1.5">
        {subValue && <p className="text-xs text-text-muted">{subValue}</p>}
        {trend && trendValue && (
          <span className={cn(
            'text-xs font-mono ml-auto',
            trend === 'up' ? 'text-accent-green' : trend === 'down' ? 'text-accent-red' : 'text-text-muted',
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
          </span>
        )}
      </div>
    </div>
  )
}
