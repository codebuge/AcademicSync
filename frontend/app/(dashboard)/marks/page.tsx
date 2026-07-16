'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { MarksTable } from '@/components/MarksTable'
import { OCRConfirmTable } from '@/components/OCRConfirmTable'
import { Plus, Camera, Loader2, Upload, AlertCircle, Save, Award, BookOpen, Trash2, CheckCircle } from 'lucide-react'
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

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<MarkForm>({
    resolver: zodResolver(markSchema) as any,
    defaultValues: { max_score: 100, credit_hours: 3, score: 85, semester: `Semester ${user?.current_semester ?? 1}` },
  })

  // Watch fields for interactive custom slider & credit controls
  const scoreVal = watch('score')
  const creditVal = watch('credit_hours')

  useEffect(() => {
    if (user?.current_semester) {
      setValue('semester', `Semester ${user.current_semester}`)
    }
  }, [user, setValue])

  const fetchMarks = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const base = '/api'
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
      const base = '/api'
      const res = await fetch(`${base}/marks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, student_id: user?.id }),
      })
      if (res.ok) {
        const newMark = await res.json()
        setMarks(prev => [newMark, ...prev])
        reset({
          course_name: '',
          credit_hours: 3,
          score: 85,
          max_score: 100,
          semester: `Semester ${user?.current_semester ?? 1}`
        })
        setSuccessMsg('Mark added successfully!')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        const err = await res.json()
        setFormError(err.detail || 'Failed to add mark')
      }
    } catch {
      setFormError('Network error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
      const base = '/api'
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
    const base = '/api'
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

  // Calculate quick stats
  const semesterMarks = marks.filter(m => m.semester === `Semester ${user?.current_semester ?? 1}`)
  const totalCredits = marks.reduce((acc, m) => acc + m.credit_hours, 0)
  const currentSemesterCredits = semesterMarks.reduce((acc, m) => acc + m.credit_hours, 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Marks Entry</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Update your academic records for the current semester</p>
        </div>

        {/* Tab Switcher */}
        <div className="p-0.5 rounded-full flex items-center border self-start sm:self-auto"
          style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'manual'
                ? 'bg-[#0F6E56] text-white shadow-sm'
                : 'text-on-surface-variant hover:opacity-80'
            }`}
          >
            Enter Marks
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'ocr'
                ? 'bg-[#0F6E56] text-white shadow-sm'
                : 'text-on-surface-variant hover:opacity-80'
            }`}
          >
            Upload Screenshot
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl text-sm flex gap-2 animate-slide-down"
          style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', color: 'var(--primary)' }}>
          <CheckCircle size={16} className="shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Manual Entry view */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Form Card Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>New Entry</h3>
              
              <form onSubmit={handleSubmit(onSubmitMark)} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl text-sm flex gap-2"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'hsl(0,84%,70%)' }}>
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Course Name</label>
                  <input
                    {...register('course_name')}
                    placeholder="e.g. Advanced Calculus"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{
                      background: 'var(--muted)',
                      border: errors.course_name ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)',
                      color: 'var(--foreground)',
                      outline: 'none'
                    }}
                  />
                  {errors.course_name && <p className="text-xs text-red-400 mt-0.5">{errors.course_name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Semester</label>
                  <input
                    {...register('semester')}
                    placeholder="e.g. Semester 3"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{
                      background: 'var(--muted)',
                      border: errors.semester ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)',
                      color: 'var(--foreground)',
                      outline: 'none'
                    }}
                  />
                  {errors.semester && <p className="text-xs text-red-400 mt-0.5">{errors.semester.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Credits</label>
                  <div className="flex items-center rounded-xl p-1" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => setValue('credit_hours', Math.max(0.5, (creditVal || 3) - 0.5))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-teal-400 hover:bg-white/[0.04] active:scale-95 transition-all font-bold text-lg"
                    >
                      -
                    </button>
                    <input
                      value={`${creditVal || 3} cr`}
                      readOnly
                      className="bg-transparent border-none text-center font-bold text-teal-400 flex-1 focus:ring-0 outline-none text-sm cursor-default"
                    />
                    <button
                      type="button"
                      onClick={() => setValue('credit_hours', Math.min(4, (creditVal || 3) + 0.5))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-teal-400 hover:bg-white/[0.04] active:scale-95 transition-all font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Score (0-100)</label>
                    <span className="text-sm font-bold text-teal-400">{scoreVal}%</span>
                  </div>
                  <div className="pt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      {...register('score', { valueAsNumber: true })}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#0F6E56]"
                      style={{ background: 'var(--border)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 hover-lift mt-2"
                  style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white', boxShadow: '0 4px 14px var(--teal-glow)' }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Add Mark
                </button>
              </form>
            </div>

            {/* Quick Stats Grid Reflow */}
            <div className="glass rounded-2xl p-5 border flex items-center justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0F6E56]/15"
                  style={{ border: '1px solid rgba(45,212,191,0.2)' }}>
                  <Award size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Semester Credits</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{currentSemesterCredits} cr</p>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/15"
                  style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
                  <BookOpen size={18} style={{ color: '#c084fc' }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Total Credits</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{totalCredits} cr</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Column */}
          <div className="lg:col-span-7">
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                Course History <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>({marks.length})</span>
              </h2>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 size={24} className="animate-spin text-teal-400" />
                </div>
              ) : (
                <MarksTable marks={marks} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* OCR / Screenshot view */}
      {activeTab === 'ocr' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {!ocrResults && !ocrLoading && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleOcrUpload(f) }}
              className="rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all border-2 border-dashed group"
              style={{
                borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
                background: isDragging ? 'rgba(45,212,191,0.04)' : 'var(--muted)',
              }}
              onClick={() => document.getElementById('ocr-file-input')?.click()}>
              <input id="ocr-file-input" type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOcrUpload(f) }} />
              <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center group-hover:scale-105 transition-transform"
                style={{ border: '1px solid var(--border)' }}>
                <Camera size={28} className={isDragging ? 'text-teal-400' : 'text-teal-500'} />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Drop your portal screenshot here</h3>
                <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--muted-foreground)' }}>
                  We&apos;ll automatically extract courses, credits, and scores for you. Supports PNG, JPG, and WebP · max 5MB
                </p>
              </div>
              <button className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md hover-lift transition-all mt-2">
                Browse Files
              </button>
            </div>
          )}

          {ocrLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl"
              style={{ background: 'var(--muted)', border: '2px dashed var(--border)' }}>
              <Loader2 size={32} className="animate-spin text-teal-400" />
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Scanning your marksheet with AI...</p>
            </div>
          )}

          {ocrError && (
            <div className="p-4 rounded-xl flex gap-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={18} style={{ color: 'hsl(0,84%,60%)' }} />
              <div>
                <p className="text-sm" style={{ color: 'hsl(0,84%,70%)' }}>{ocrError}</p>
                <button onClick={() => { setOcrError(null) }} className="text-xs mt-2 hover:underline text-teal-400">Try again</button>
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
  )
}
