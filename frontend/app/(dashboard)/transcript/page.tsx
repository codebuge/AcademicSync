'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { Lock, Upload, CheckCircle, XCircle, Clock, FileText, Loader2, AlertCircle, Calendar, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react'
import type { Transcript, ReconciliationResult } from '@/types'

export default function TranscriptPage() {
  const { user } = useAppStore()
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [semester, setSemester] = useState('')

  const fetchTranscripts = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const base = '/api'
      const res = await fetch(`${base}/transcripts`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setTranscripts(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTranscripts() }, [fetchTranscripts])

  const handleUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Maximum 10MB.')
      return
    }
    setUploading(true)
    setUploadError(null)
    setReconciliation(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const formData = new FormData()
      formData.append('file', file)
      if (semester) formData.append('semester', semester)
      const base = '/api'
      const res = await fetch(`${base}/transcripts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })
      if (res.ok) {
        const result: ReconciliationResult = await res.json()
        setReconciliation(result)
        await fetchTranscripts()
      } else if (res.status === 403) {
        setUploadError('Transcript upload is only available from Semester 2 onwards.')
      } else {
        const err = await res.json()
        setUploadError(err.detail || 'Upload failed.')
      }
    } finally { setUploading(false) }
  }

  const parseStatusIcon = (status: string) => {
    if (status === 'parsed') return <CheckCircle size={15} style={{ color: 'hsl(160,84%,50%)' }} />
    if (status === 'failed') return <XCircle size={15} style={{ color: 'hsl(0,84%,60%)' }} />
    return <Clock size={15} style={{ color: 'hsl(38,92%,50%)' }} />
  }

  // Semester 1 — locked state
  if (user && user.current_semester < 2) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Transcript Submission</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Submission is locked during active evaluations</p>
        </div>

        <div className="glass rounded-3xl p-12 flex flex-col items-center text-center animate-slide-up">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <Lock size={36} className="text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Submission Locked</h2>
          <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Transcript upload unlocks in <strong>Semester 2</strong>. You are currently in Semester 1.
          </p>

          <div className="w-full max-w-md p-5 rounded-2xl text-left border"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--foreground)' }}>Unlock Schedule</h4>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-2 h-2 rounded-full mt-1.5 bg-[#8b5cf6]" />
              <div className="flex-1 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Semester 2 Launch</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Unlock automatic verification & projections</p>
              </div>
            </div>
            <div className="flex items-start gap-4 opacity-60">
              <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: 'var(--primary)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Semester 1 Ongoing</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Enter draft marks manually or upload portals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Upload Academic Transcript</h1>
          <p className="text-sm max-w-2xl" style={{ color: 'var(--muted-foreground)' }}>
            Upload your official University transcript to sync your academic history. We automatically reconcile existing marks and identify new course enrollments.
          </p>
        </div>
        <div className="glass rounded-2xl p-5 flex flex-col justify-center border" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--primary)' }}>
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Status: Submission Open</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Semester 2 submission is active. Final deadline: <strong style={{ color: 'var(--foreground)' }}>Dec 15th</strong>.
          </p>
        </div>
      </div>

      {/* Main Grid: Upload & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Upload Card */}
        <div className="lg:col-span-8 glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.2)' }}>
                <Upload size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Upload Transcript PDF</h2>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Semester Context (optional)</label>
            <input value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. Fall 2024 or Semester 2"
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl flex gap-2 text-sm animate-slide-down"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'hsl(0,84%,70%)' }}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {uploadError}
            </div>
          )}

          {uploading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-2xl"
              style={{ background: 'var(--muted)', border: '2px dashed var(--border)' }}>
              <Loader2 size={24} className="animate-spin text-teal-400" />
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Parsing and verifying transcript structure...</p>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
              onClick={() => document.getElementById('pdf-input')?.click()}
              className="rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all border-2 border-dashed group"
              style={{
                borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
                background: isDragging ? 'rgba(45,212,191,0.04)' : 'var(--muted)',
              }}>
              <input id="pdf-input" type="file" accept="application/pdf" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
              <div className="w-14 h-14 bg-white/[0.03] rounded-full flex items-center justify-center group-hover:scale-105 transition-transform"
                style={{ border: '1px solid var(--border)' }}>
                <FileText size={24} className={isDragging ? 'text-teal-400' : 'text-teal-500'} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Drop your transcript PDF here</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>or click to browse · PDF only · max 10MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Reconciliation Summary */}
        <div className="lg:col-span-4 glass rounded-2xl p-5 border flex flex-col justify-between" style={{ borderColor: 'var(--border)', minHeight: '330px' }}>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted-foreground)' }}>Reconciliation Preview</h4>
            <div className="space-y-4">
              {[
                { label: 'Verified Courses', value: reconciliation ? reconciliation.verified_count : '—', icon: CheckCircle, color: 'hsl(160,84%,50%)', bg: 'rgba(45,212,191,0.08)' },
                { label: 'New Entries Added', value: reconciliation ? reconciliation.new_count : '—', icon: CheckCircle, color: 'var(--primary)', bg: 'rgba(45,212,191,0.08)' },
                { label: 'Unmatched Courses', value: reconciliation ? reconciliation.unmatched.length : '—', icon: AlertCircle, color: 'hsl(38,92%,50%)', bg: 'rgba(245,158,11,0.08)' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{label}</span>
                  </div>
                  <span className="text-base font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>

            {reconciliation && reconciliation.unmatched.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-medium mb-1.5" style={{ color: 'hsl(38,92%,60%)' }}>Unmatched courses:</p>
                <div className="flex flex-wrap gap-1.5">
                  {reconciliation.unmatched.map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.12)', color: 'hsl(38,92%,60%)' }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-dashed text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[10px] italic" style={{ color: 'var(--muted-foreground)' }}>
              Syncing will update your GPA and major progress automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Transcript History */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Upload History</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-teal-400" />
          </div>
        ) : transcripts.length === 0 ? (
          <div className="flex items-center justify-center h-24 rounded-xl"
            style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No transcripts uploaded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm text-left">
              <thead style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th className="py-2.5 px-4 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>File Name</th>
                  <th className="py-2.5 px-4 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Uploaded Date</th>
                  <th className="py-2.5 px-4 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Semester</th>
                  <th className="py-2.5 px-4 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transcripts.map((t, i) => (
                  <tr key={t.id} className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: i < transcripts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <FileText size={14} className="text-teal-400" />
                      <span className="truncate max-w-[200px]" style={{ color: 'var(--foreground)' }}>
                        {t.semester ? `${t.semester}_Transcript.pdf` : 'Transcript.pdf'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--foreground)' }}>
                        {t.semester || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semiboldcapitalize"
                        style={{
                          background: t.parse_status === 'parsed' ? 'rgba(45,212,191,0.1)' : t.parse_status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          color: t.parse_status === 'parsed' ? 'var(--primary)' : t.parse_status === 'failed' ? 'hsl(0,84%,65%)' : 'hsl(38,92%,60%)',
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{
                          background: t.parse_status === 'parsed' ? 'var(--primary)' : t.parse_status === 'failed' ? 'hsl(0,84%,65%)' : 'hsl(38,92%,60%)'
                        }} />
                        {t.parse_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
