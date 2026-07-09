'use client'

import { Trash2 } from 'lucide-react'

interface CourseRowProps {
  index: number
  courseName: string
  creditHours: string
  score: string
  errors?: {
    courseName?: string
    creditHours?: string
    score?: string
  }
  onChange: (index: number, field: 'courseName' | 'creditHours' | 'score', value: string) => void
  onRemove: (index: number) => void
}

export default function CourseRow({
  index,
  courseName,
  creditHours,
  score,
  errors,
  onChange,
  onRemove
}: CourseRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-4 rounded-xl border md:border-0 md:p-0"
      style={{
        borderColor: (errors?.courseName || errors?.creditHours || errors?.score) ? 'rgba(239,68,68,0.3)' : 'transparent',
        background: (errors?.courseName || errors?.creditHours || errors?.score) ? 'rgba(239,68,68,0.02)' : 'transparent'
      }}>
      {/* Course Name */}
      <div className="md:col-span-6">
        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 md:hidden" style={{ color: 'var(--muted-foreground)' }}>Course Name</label>
        <input
          type="text"
          value={courseName}
          onChange={(e) => onChange(index, 'courseName', e.target.value)}
          placeholder="e.g. Intro to Programming"
          className="w-full px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: 'var(--muted)',
            border: errors?.courseName ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border)',
            color: 'var(--foreground)'
          }}
        />
        {errors?.courseName && (
          <p className="text-[11px] mt-0.5" style={{ color: 'hsl(0,84%,60%)' }}>{errors.courseName}</p>
        )}
      </div>

      {/* Credit Hours */}
      <div className="md:col-span-3">
        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 md:hidden" style={{ color: 'var(--muted-foreground)' }}>Credit Hours (0.5 - 6)</label>
        <input
          type="number"
          step="0.5"
          value={creditHours}
          onChange={(e) => onChange(index, 'creditHours', e.target.value)}
          placeholder="3.0"
          className="w-full px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: 'var(--muted)',
            border: errors?.creditHours ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border)',
            color: 'var(--foreground)'
          }}
        />
        {errors?.creditHours && (
          <p className="text-[11px] mt-0.5" style={{ color: 'hsl(0,84%,60%)' }}>{errors.creditHours}</p>
        )}
      </div>

      {/* Score */}
      <div className="md:col-span-2">
        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1 md:hidden" style={{ color: 'var(--muted-foreground)' }}>Score (0 - 100)</label>
        <input
          type="number"
          value={score}
          onChange={(e) => onChange(index, 'score', e.target.value)}
          placeholder="85"
          className="w-full px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: 'var(--muted)',
            border: errors?.score ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border)',
            color: 'var(--foreground)'
          }}
        />
        {errors?.score && (
          <p className="text-[11px] mt-0.5" style={{ color: 'hsl(0,84%,60%)' }}>{errors.score}</p>
        )}
      </div>

      {/* Actions */}
      <div className="md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-1">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          title="Remove course">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
