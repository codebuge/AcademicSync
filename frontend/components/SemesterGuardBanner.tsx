'use client'

import { useAppStore } from '@/store/useAppStore'
import { Lock, X } from 'lucide-react'

export function SemesterGuardBanner() {
  const { hideSemesterGuard } = useAppStore()

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm animate-slide-down"
      style={{
        background: 'rgba(45,212,191,0.08)',
        borderBottom: '1px solid rgba(45,212,191,0.2)',
        color: 'var(--primary)',
      }}
    >
      <Lock size={15} className="shrink-0" />
      <span className="flex-1 text-xs">
        <strong>Transcript upload locked.</strong> This feature unlocks in Semester 2.
        Complete Semester 1 and advance to unlock PDF transcript uploads and mark reconciliation.
      </span>
      <button
        onClick={hideSemesterGuard}
        className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
