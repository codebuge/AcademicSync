import React from 'react'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: 'Draft', bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  pending_verification: { label: 'Pending', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  verified: { label: 'Verified', bg: 'rgba(45,212,191,0.15)', color: '#2dd4bf' },
  locked: { label: 'Locked', bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${padding} ${className}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}
