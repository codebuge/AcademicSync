'use client'

import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { Mark } from '@/types'

interface MarksTableProps {
  marks: Mark[]
}

type SortKey = 'course_name' | 'semester' | 'score' | 'credit_hours' | 'status'


export function MarksTable({ marks }: MarksTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('course_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...marks].sort((a, b) => {
    const valA = a[sortKey] ?? ''
    const valB = b[sortKey] ?? ''
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (marks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-xl"
        style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No marks yet — add your first course above</p>
      </div>
    )
  }

  const HeaderCell = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <th
      className="text-left py-2.5 px-3 text-xs font-semibold cursor-pointer select-none transition-colors"
      style={{ color: sortKey === sortField ? 'var(--primary)' : 'var(--muted-foreground)', whiteSpace: 'nowrap' }}
      onClick={() => handleSort(sortField)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className="opacity-50" />
      </span>
    </th>
  )

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <HeaderCell label="Course" sortField="course_name" />
              <HeaderCell label="Semester" sortField="semester" />
              <HeaderCell label="Score %" sortField="score" />
              <HeaderCell label="Credits" sortField="credit_hours" />
              <th className="text-left py-2.5 px-3 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Grade</th>
              <HeaderCell label="Status" sortField="status" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((mark, i) => {
              const scoreColor = mark.score >= 80 ? '#2dd4bf' : mark.score >= 60 ? '#fbbf24' : '#f87171'
              return (
                <tr key={mark.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 px-3">
                    <p className="font-medium truncate max-w-[180px]" style={{ color: 'var(--foreground)' }}>{mark.course_name}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--muted-foreground)' }}>{mark.source}</p>
                  </td>
                  <td className="py-3 px-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{mark.semester}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold tabular-nums" style={{ color: scoreColor }}>{mark.score}%</span>
                  </td>
                  <td className="py-3 px-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{mark.credit_hours} cr</td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-xs" style={{ color: 'var(--foreground)' }}>{mark.letter_grade || '—'}</span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={mark.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {sorted.map((mark) => {
          const scoreColor = mark.score >= 80 ? '#2dd4bf' : mark.score >= 60 ? '#fbbf24' : '#f87171'
          return (
            <div key={mark.id} className="glass rounded-xl p-4 border" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-sm text-white truncate max-w-[180px]">{mark.course_name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{mark.semester} · {mark.credit_hours} cr</p>
                </div>
                <StatusBadge status={mark.status} />
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[11px] capitalize" style={{ color: 'var(--muted-foreground)' }}>Source: {mark.source}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Score:</span>
                  <span className="font-bold text-sm" style={{ color: scoreColor }}>{mark.score}%</span>
                  {mark.letter_grade && (
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white font-semibold">{mark.letter_grade}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

