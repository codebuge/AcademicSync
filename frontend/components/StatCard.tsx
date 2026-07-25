'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  colorClass?: string
  accentColor?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, colorClass = '', accentColor = '#10b981' }: StatCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5 hover-lift transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <div
          className="p-2 rounded-xl"
          style={{ background: `${accentColor}18` }}
        >
          <Icon size={16} style={{ color: accentColor }} />
        </div>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${colorClass}`} style={{ color: colorClass ? undefined : 'white' }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs mt-1.5 text-slate-400">{subtitle}</p>
      )}
    </div>
  )
}

