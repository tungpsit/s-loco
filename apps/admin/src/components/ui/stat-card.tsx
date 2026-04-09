'use client'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  accent?: string
  trend?: { value: number; positive: boolean }
}

export function StatCard({ icon, label, value, accent = 'bg-primary-fixed', trend }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-4 md:p-5">
      <span className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl text-lg md:text-xl ${accent}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs md:text-sm text-on-surface-variant truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg md:text-2xl font-display font-bold text-on-surface truncate">
            {value}
          </p>
          {trend && (
            <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-error'}`}>
              {trend.positive ? '▲' : '▼'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
