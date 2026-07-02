'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, Save, X } from 'lucide-react'
import type { OcrExtractedMark } from '@/types'

interface OCRConfirmTableProps {
  results: OcrExtractedMark[]
  onConfirm: (marks: OcrExtractedMark[]) => void
  onCancel: () => void
}

export function OCRConfirmTable({ results, onConfirm, onCancel }: OCRConfirmTableProps) {
  const [editedMarks, setEditedMarks] = useState<OcrExtractedMark[]>(results.map(m => ({ ...m })))
  const [confirmed, setConfirmed] = useState<Set<number>>(
    new Set(results.map((m, i) => m.flagged ? -1 : i).filter(i => i >= 0))
  )

  const updateMark = (index: number, field: keyof OcrExtractedMark, value: string | number) => {
    setEditedMarks(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const toggleConfirm = (index: number) => {
    setConfirmed(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const allFlaggedConfirmed = editedMarks.every((m, i) => !m.flagged || confirmed.has(i))
  const selectedMarks = editedMarks.filter((_, i) => confirmed.has(i))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>OCR Results</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {results.length} courses extracted · {results.filter(m => m.flagged).length} flagged for review
          </p>
        </div>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <X size={16} style={{ color: 'var(--muted-foreground)' }} />
        </button>
      </div>

      {results.some(m => m.flagged) && (
        <div className="p-3 rounded-xl flex gap-2 text-xs"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'hsl(38,92%,65%)' }}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          Amber rows have low confidence. Review and edit before saving. Check the box to confirm each.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th className="py-2.5 px-3 text-left text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Course</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Credits</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Score %</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Confidence</th>
              <th className="py-2.5 px-3 text-center text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Include</th>
            </tr>
          </thead>
          <tbody>
            {editedMarks.map((mark, i) => {
              const isLow = mark.flagged || mark.confidence < 0.85
              return (
                <tr key={i}
                  className="transition-colors"
                  style={{
                    background: isLow ? 'rgba(245,158,11,0.06)' : 'transparent',
                    borderBottom: i < editedMarks.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                  <td className="py-2.5 px-3">
                    {isLow ? (
                      <input
                        value={mark.course_name}
                        onChange={e => updateMark(i, 'course_name', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--foreground)', outline: 'none' }}
                      />
                    ) : (
                      <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{mark.course_name}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {isLow ? (
                      <input type="number" min="0.5" max="4" step="0.5"
                        value={mark.credit_hours}
                        onChange={e => updateMark(i, 'credit_hours', parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--foreground)', outline: 'none' }}
                      />
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{mark.credit_hours}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {isLow ? (
                      <input type="number" min="0" max="100" step="0.1"
                        value={mark.score}
                        onChange={e => updateMark(i, 'score', parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--foreground)', outline: 'none' }}
                      />
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: '#2dd4bf' }}>{mark.score}%</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      {isLow
                        ? <AlertTriangle size={12} style={{ color: '#fbbf24' }} />
                        : <CheckCircle size={12} style={{ color: '#2dd4bf' }} />
                      }
                      <span className="text-xs tabular-nums"
                        style={{ color: isLow ? '#fbbf24' : '#2dd4bf' }}>
                        {(mark.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={confirmed.has(i)}
                      onChange={() => toggleConfirm(i)}
                      className="w-4 h-4 rounded cursor-pointer accent-teal-400"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {selectedMarks.length} of {results.length} marks selected
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedMarks)}
            disabled={!allFlaggedConfirmed || selectedMarks.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white', boxShadow: '0 4px 12px var(--teal-glow)' }}>
            <Save size={13} /> Save {selectedMarks.length} Mark{selectedMarks.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
