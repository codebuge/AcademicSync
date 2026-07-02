'use client'

import { useRef, useState } from 'react'
import { TriangleAlert, XCircle, ImageIcon, Loader2, RefreshCcw } from 'lucide-react'

type OCRError = 'GRADING_SCALE_LOW_CONFIDENCE' | 'GRADING_SCALE_MALFORMED' | null

interface GradingScaleUploadProps {
  onFileSelect: (file: File) => void
  error: OCRError
  isProcessing?: boolean
}

export function GradingScaleUpload({ onFileSelect, error, isProcessing }: GradingScaleUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    onFileSelect(file)
  }

  const reset = () => {
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {!isProcessing && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl cursor-pointer transition-all duration-200 overflow-hidden relative"
          style={{
            border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
            background: isDragging ? 'rgba(45,212,191,0.04)' : 'var(--muted)',
            minHeight: preview ? '120px' : '80px',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected grading scale" className="w-full h-32 object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center py-5 gap-2">
              <ImageIcon size={22} style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                Drop grading scale screenshot here<br />
                <span style={{ color: 'var(--primary)' }}>or click to browse</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>PNG · JPG · WebP · max 5MB</p>
            </div>
          )}
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="flex items-center justify-center py-6 gap-3 rounded-xl"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Scanning grading table...</span>
        </div>
      )}

      {/* LOW CONFIDENCE Error — amber panel */}
      {error === 'GRADING_SCALE_LOW_CONFIDENCE' && !isProcessing && (
        <div className="rounded-xl p-4 animate-slide-down"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <div className="flex gap-3">
            <TriangleAlert size={18} className="shrink-0 mt-0.5" style={{ color: 'hsl(38,92%,55%)' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(38,92%,70%)' }}>
                Photo too blurry or unclear
              </p>
              <p className="text-xs mb-3" style={{ color: 'hsl(38,92%,55%)' }}>
                Try better lighting and make sure the table isn&apos;t tilted or blurry.
                Hold your camera steady and shoot straight-on.
              </p>
              <p className="text-xs font-medium mb-2" style={{ color: 'hsl(38,92%,55%)' }}>Example of a good photo:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/grading_scale_example.png"
                alt="Example of a clear grading scale photograph"
                className="w-full rounded-lg object-cover mb-3"
                style={{ maxHeight: '130px', border: '1px solid rgba(245,158,11,0.25)' }}
              />
              <button
                type="button"
                onClick={() => { reset() }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(245,158,11,0.2)', color: 'hsl(38,92%,70%)', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                <RefreshCcw size={12} /> Try again with a clearer photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MALFORMED Error — red panel */}
      {error === 'GRADING_SCALE_MALFORMED' && !isProcessing && (
        <div className="rounded-xl p-4 animate-slide-down"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)' }}>
          <div className="flex gap-3">
            <XCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'hsl(0,84%,65%)' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(0,84%,70%)' }}>
                Grading table not found
              </p>
              <p className="text-xs mb-2" style={{ color: 'hsl(0,84%,55%)' }}>
                We couldn&apos;t find a grading table in that image. Please upload a clear photo of your
                university&apos;s grading scale table — <strong>not</strong> a transcript, syllabus, or other document.
              </p>
              <p className="text-xs mb-3" style={{ color: 'hsl(0,84%,55%)' }}>
                The table should show: <strong>percentage ranges → letter grades → GPA points</strong>
              </p>
              <button
                type="button"
                onClick={() => { reset() }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(239,68,68,0.2)', color: 'hsl(0,84%,70%)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <RefreshCcw size={12} /> Upload correct image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
