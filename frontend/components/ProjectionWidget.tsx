'use client'

import { useState } from 'react'
import { Target, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import type { ProjectionResult } from '@/types'

interface ProjectionWidgetProps {
  currentCgpa: number
  onCalculate: (target: number, remaining: number) => void
  result: ProjectionResult | null
  isLoading?: boolean
}

export function ProjectionWidget({ currentCgpa, onCalculate, result, isLoading }: ProjectionWidgetProps) {
  const [target, setTarget] = useState(3.5)
  const [remaining, setRemaining] = useState(4)

  const achievabilityConfig = result
    ? result.achievable
      ? { label: '✓ Achievable', color: 'hsl(160,84%,50%)', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.25)' }
      : result.required_gpa > 4.0
        ? { label: '✗ Not Achievable', color: 'hsl(0,84%,60%)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' }
        : { label: '⚠ Very Difficult', color: 'hsl(38,92%,50%)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' }
    : null

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target size={16} style={{ color: 'var(--primary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>CGPA Projection</h3>
      </div>

      <div className="text-xs px-3 py-2 rounded-xl"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
        Current CGPA: <strong className="text-teal-400">{currentCgpa.toFixed(2)}</strong>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Target CGPA</label>
          <input
            type="number" value={target} min="0" max="4" step="0.01"
            onChange={e => setTarget(parseFloat(e.target.value))}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Remaining Sems</label>
          <input
            type="number" value={remaining} min="1" max="12"
            onChange={e => setRemaining(parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
          />
        </div>
      </div>

      <button
        onClick={() => onCalculate(target, remaining)}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white' }}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
        Calculate
      </button>

      {result && achievabilityConfig && (
        <div className="p-4 rounded-xl animate-slide-down"
          style={{ background: achievabilityConfig.bg, border: `1px solid ${achievabilityConfig.border}` }}>
          <div className="flex items-start gap-3">
            {result.achievable
              ? <TrendingUp size={18} style={{ color: achievabilityConfig.color }} />
              : <AlertCircle size={18} style={{ color: achievabilityConfig.color }} />
            }
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: achievabilityConfig.color }}>
                {achievabilityConfig.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Required GPA per semester:{' '}
                <strong style={{ color: achievabilityConfig.color }}>{result.required_gpa.toFixed(2)}</strong>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Target {result.target_cgpa.toFixed(2)} in {result.remaining_semesters} semesters
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
