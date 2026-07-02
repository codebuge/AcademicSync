'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { MarksTable } from '@/components/MarksTable'
import { OCRConfirmTable } from '@/components/OCRConfirmTable'
import { Plus, Camera, Loader2, Upload, AlertCircle } from 'lucide-react'
import type { Mark, OcrExtractedMark, OcrResponse } from '@/types'

const markSchema = z.object({
  course_name: z.string().min(2, 'Course name required'),
  credit_hours: z.number().min(0.5).max(4),
  score: z.number().min(0).max(100),
  semester: z.string().min(1, 'Semester required'),
  max_score: z.number().default(100),
})
type MarkForm = z.infer<typeof markSchema>

export default function MarksPage() {
  const { user } = useAppStore()
  const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>('manual')
  const [marks, setMarks] = useState<Mark[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResults, setOcrResults] = useState<OcrExtractedMark[] | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MarkForm>({
    resolver: zodResolver(markSchema) as any,
    defaultValues: { max_score: 100, credit_hours: 3, score: 0 },
  })

  const fetchMarks = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${base}/marks`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setMarks(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMarks() }, [fetchMarks])

  const onSubmitMark = async (data: MarkForm) => {
    setSubmitting(true)
    setFormError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${base}/marks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, student_id: user?.id }),
      })
      if (res.ok) {
        const newMark = await res.json()
        setMarks(prev => [newMark, ...prev])
        reset()
        setSuccessMsg('Mark added successfully!')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        const err = await res.json()
        setFormError(err.detail || 'Failed to add mark')
      }
    } finally { setSubmitting(false) }
  }

  const handleOcrUpload = async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/jpg'].includes(file.type)) {
      setOcrError('Invalid file type. Please upload PNG, JPG, or WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setOcrError('File too large. Maximum size is 5MB.')
      return
    }
    setOcrLoading(true)
    setOcrError(null)
    setOcrResults(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const formData = new FormData()
      formData.append('file', file)
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${base}/ocr/extract`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })
      if (res.ok) {
        const data: OcrResponse = await res.json()
        setOcrResults(data.marks)
      } else if (res.status === 429) {
        setOcrError('Rate limit reached. You can perform 10 OCR scans per hour.')
      } else {
        const err = await res.json()
        setOcrError(err.detail || 'OCR processing failed.')
      }
    } finally { setOcrLoading(false) }
  }

  const handleOcrConfirm = async (confirmedMarks: OcrExtractedMark[]) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    let added = 0
    for (const m of confirmedMarks) {
      const res = await fetch(`${base}/marks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_name: m.course_name,
          credit_hours: m.credit_hours,
          score: m.score,
          semester: `Semester ${user?.current_semester ?? 1}`,
          source: 'ocr_extracted',
          student_id: user?.id,
        }),
      })
      if (res.ok) added++
    }
    setOcrResults(null)
    await fetchMarks()
    setSuccessMsg(`${added} marks saved from OCR!`)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Marks</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Add and manage your course marks</p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg text-sm animate-slide-down"
          style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', color: 'var(--primary)' }}>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'manual', label: 'Enter Marks', icon: Plus },
            { id: 'ocr', label: 'Upload Screenshot', icon: Camera },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id as 'manual' | 'ocr')}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200"
              style={{
                color: activeTab === id ? 'var(--primary)' : 'var(--muted-foreground)',
                borderBottom: activeTab === id ? '2px solid var(--primary)' : '2px solid transparent',
                background: activeTab === id ? 'rgba(45,212,191,0.05)' : 'transparent',
              }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'manual' && (
            <form onSubmit={handleSubmit(onSubmitMark)}>
              {formError && (
                <div className="mb-4 p-3 rounded-lg text-sm flex gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'hsl(0,84%,70%)' }}>
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {formError}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Course Name</label>
                  <input {...register('course_name')} placeholder="e.g. Calculus II"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--muted)', border: errors.course_name ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
                  {errors.course_name && <p className="text-xs mt-0.5" style={{ color: 'hsl(0,84%,60%)' }}>{errors.course_name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Score (%)</label>
                  <input {...register('score', { valueAsNumber: true })} type="number" min="0" max="100" step="0.1" placeholder="0-100"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Credit Hours</label>
                  <select {...register('credit_hours', { valueAsNumber: true })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}>
                    {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map(v => <option key={v} value={v}>{v} cr</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Semester</label>
                  <input {...register('semester')} placeholder="e.g. Fall 2024 or Semester 3"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--muted)', border: errors.semester ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
                  {errors.semester && <p className="text-xs mt-0.5" style={{ color: 'hsl(0,84%,60%)' }}>{errors.semester.message}</p>}
                </div>

                <div className="col-span-2 flex justify-end">
                  <button type="submit" disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,30%))', color: 'white', boxShadow: '0 4px 14px var(--teal-glow)' }}>
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Add Mark
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-4">
              {!ocrResults && !ocrLoading && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleOcrUpload(f) }}
                  className="rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all"
                  style={{
                    border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
                    background: isDragging ? 'rgba(45,212,191,0.04)' : 'var(--muted)',
                  }}
                  onClick={() => document.getElementById('ocr-file-input')?.click()}>
                  <input id="ocr-file-input" type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOcrUpload(f) }} />
                  <Upload size={28} style={{ color: 'var(--primary)' }} />
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Drop your marksheet screenshot</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>or click to browse · PNG, JPG, WebP · max 5MB</p>
                  </div>
                </div>
              )}

              {ocrLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-10 h-10 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--muted)', borderTopColor: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Scanning your marksheet with AI...</p>
                </div>
              )}

              {ocrError && (
                <div className="p-4 rounded-xl flex gap-3"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle size={18} style={{ color: 'hsl(0,84%,60%)' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'hsl(0,84%,70%)' }}>{ocrError}</p>
                    <button onClick={() => { setOcrError(null) }} className="text-xs mt-2 hover:underline" style={{ color: 'var(--primary)' }}>Try again</button>
                  </div>
                </div>
              )}

              {ocrResults && (
                <OCRConfirmTable
                  results={ocrResults}
                  onConfirm={handleOcrConfirm}
                  onCancel={() => setOcrResults(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Marks table */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          All Marks <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>({marks.length})</span>
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--muted)', borderTopColor: 'var(--primary)' }} />
          </div>
        ) : (
          <MarksTable marks={marks} />
        )}
      </div>
    </div>
  )
}
