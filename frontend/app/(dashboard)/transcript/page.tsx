'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { Lock, Upload, CheckCircle, XCircle, Clock, FileText, Loader2, AlertCircle } from 'lucide-react'
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
    if (status === 'parsed') return <CheckCircle size={14} style={{ color: 'hsl(160,84%,50%)' }} />
    if (status === 'failed') return <XCircle size={14} style={{ color: 'hsl(0,84%,60%)' }} />
    return <Clock size={14} style={{ color: 'hsl(38,92%,50%)' }} />
  }

  // Semester 1 — locked state
  if (user && user.current_semester < 2) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Transcript</h1>
        <div className="glass rounded-3xl p-12 flex flex-col items-center text-center animate-slide-up">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Lock size={36} style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Locked Until Semester 2</h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
            You&apos;re currently in Semester 1. Transcript upload becomes available once you advance to Semester 2.
          </p>
          <div className="mt-6 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(45,212,191,0.1)', color: 'var(--primary)', border: '1px solid rgba(45,212,191,0.2)' }}>
            Complete Semester 1 → Advance to Semester 2 → Upload transcripts
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Transcript</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Upload your official transcript to verify and reconcile marks</p>
      </div>

      {/* Upload card */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Upload size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Upload Transcript PDF</h2>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Semester (optional)</label>
          <input value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. Fall 2024 or Semester 2"
            className="w-full max-w-xs px-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl flex gap-2 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'hsl(0,84%,70%)' }}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {uploadError}
          </div>
        )}

        {reconciliation && (
          <div className="p-4 rounded-xl animate-slide-down"
            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.25)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--primary)' }}>✓ Reconciliation Complete</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Verified', value: reconciliation.verified_count, color: 'hsl(160,84%,50%)' },
                { label: 'New Added', value: reconciliation.new_count, color: 'var(--primary)' },
                { label: 'Unmatched', value: reconciliation.unmatched.length, color: 'hsl(38,92%,50%)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                </div>
              ))}
            </div>
            {reconciliation.unmatched.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium mb-1" style={{ color: 'hsl(38,92%,60%)' }}>Unmatched courses:</p>
                <div className="flex flex-wrap gap-2">
                  {reconciliation.unmatched.map(c => (
                    <span key={c} className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.12)', color: 'hsl(38,92%,60%)' }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Parsing your transcript...</p>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
            onClick={() => document.getElementById('pdf-input')?.click()}
            className="rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all"
            style={{
              border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              background: isDragging ? 'rgba(45,212,191,0.04)' : 'var(--muted)',
            }}>
            <input id="pdf-input" type="file" accept="application/pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
            <FileText size={32} style={{ color: isDragging ? 'var(--primary)' : 'var(--muted-foreground)' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Drop your transcript PDF here</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>or click to browse · PDF only · max 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Transcript history */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Upload History</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--muted)', borderTopColor: 'var(--primary)' }} />
          </div>
        ) : transcripts.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>No transcripts uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {transcripts.map(t => (
              <div key={t.id} className="flex items-center gap-4 p-3.5 rounded-xl transition-colors hover:bg-white/[0.02]"
                style={{ border: '1px solid var(--border)' }}>
                {parseStatusIcon(t.parse_status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                    {t.semester || 'Unknown semester'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg capitalize"
                  style={{
                    background: t.parse_status === 'parsed' ? 'rgba(45,212,191,0.1)' : t.parse_status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: t.parse_status === 'parsed' ? 'var(--primary)' : t.parse_status === 'failed' ? 'hsl(0,84%,65%)' : 'hsl(38,92%,60%)',
                  }}>
                  {t.parse_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
