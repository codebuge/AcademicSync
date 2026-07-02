'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2, TriangleAlert, XCircle, Upload, Image as ImageIcon } from 'lucide-react'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  current_semester: z.number().min(1).max(12),
})

type SignupForm = z.infer<typeof signupSchema>
type OCRError = 'GRADING_SCALE_LOW_CONFIDENCE' | 'GRADING_SCALE_MALFORMED' | null

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [ocrError, setOcrError] = useState<OCRError>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [gradingFile, setGradingFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema), defaultValues: { current_semester: 1 } })

  const handleFileChange = (file: File) => {
    setGradingFile(file)
    setOcrError(null)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: SignupForm) => {
    if (!gradingFile) {
      setAuthError('Please upload your grading scale screenshot.')
      return
    }
    setIsLoading(true)
    setAuthError(null)
    setOcrError(null)

    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('full_name', data.full_name)
      formData.append('current_semester', String(data.current_semester))
      formData.append('grading_scale_image', gradingFile)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/auth/signup`, { method: 'POST', body: formData })
      const body = await res.json()

      if (!res.ok) {
        const code = body.code || body.detail?.code
        if (code === 'GRADING_SCALE_LOW_CONFIDENCE' || code === 'GRADING_SCALE_MALFORMED') {
          setOcrError(code)
        } else {
          setAuthError(body.detail || 'Signup failed. Please try again.')
        }
        return
      }
      router.push('/login?registered=1')
    } catch {
      setAuthError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Create account</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Start tracking your academic performance</p>

      {authError && (
        <div className="mb-4 p-3 rounded-lg text-sm animate-slide-down"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'hsl(0,84%,70%)' }}>
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Full Name</label>
            <input {...register('full_name')} placeholder="Ahmad Khan"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--muted)', border: errors.full_name ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
            {errors.full_name && <p className="text-xs mt-0.5" style={{ color: 'hsl(0,84%,60%)' }}>{errors.full_name.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Email</label>
            <input {...register('email')} type="email" placeholder="you@university.edu"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--muted)', border: errors.email ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
            {errors.email && <p className="text-xs mt-0.5" style={{ color: 'hsl(0,84%,60%)' }}>{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Password</label>
            <input {...register('password')} type="password" placeholder="Min 8 chars"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--muted)', border: errors.password ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
            {errors.password && <p className="text-xs mt-0.5" style={{ color: 'hsl(0,84%,60%)' }}>{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Current Semester</label>
            <select {...register('current_semester', { valueAsNumber: true })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grading Scale Upload */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
            Grading Scale Screenshot <span style={{ color: 'var(--primary)' }}>*</span>
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileChange(f) }}
            onClick={() => fileRef.current?.click()}
            className="relative rounded-xl cursor-pointer transition-all duration-200 overflow-hidden"
            style={{
              border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              background: isDragging ? 'rgba(45,212,191,0.05)' : 'var(--muted)',
              minHeight: preview ? '120px' : '80px',
            }}>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }} />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Grading scale preview" className="w-full h-32 object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center py-5 gap-2">
                <ImageIcon size={24} style={{ color: 'var(--muted-foreground)' }} />
                <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                  Drop your grading scale screenshot here<br />
                  <span style={{ color: 'var(--primary)' }}>or click to browse</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>PNG, JPG, WebP · max 5MB</p>
              </div>
            )}
          </div>
          {gradingFile && !preview && (
            <p className="text-xs mt-1" style={{ color: 'var(--primary)' }}>{gradingFile.name}</p>
          )}
        </div>

        {/* OCR Error Panels — DISTINCT by design */}
        {ocrError === 'GRADING_SCALE_LOW_CONFIDENCE' && (
          <div className="rounded-xl p-4 animate-slide-down"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)' }}>
            <div className="flex gap-3">
              <TriangleAlert size={20} className="shrink-0 mt-0.5" style={{ color: 'hsl(38,92%,55%)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'hsl(38,92%,70%)' }}>Photo too blurry or unclear</p>
                <p className="text-xs mb-3" style={{ color: 'hsl(38,92%,55%)' }}>
                  Try better lighting and make sure the table isn&apos;t tilted or blurry. Hold the camera steady and shoot straight-on.
                </p>
                <p className="text-xs font-medium mb-2" style={{ color: 'hsl(38,92%,55%)' }}>Example of a good photo:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/grading_scale_example.png" alt="Example grading scale photo"
                  className="w-full rounded-lg object-cover" style={{ maxHeight: '120px', border: '1px solid rgba(245,158,11,0.25)' }} />
                <button type="button" onClick={() => { setOcrError(null); setGradingFile(null); setPreview(null) }}
                  className="mt-3 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={{ background: 'rgba(245,158,11,0.2)', color: 'hsl(38,92%,70%)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  Try again with a clearer photo
                </button>
              </div>
            </div>
          </div>
        )}

        {ocrError === 'GRADING_SCALE_MALFORMED' && (
          <div className="rounded-xl p-4 animate-slide-down"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)' }}>
            <div className="flex gap-3">
              <XCircle size={20} className="shrink-0 mt-0.5" style={{ color: 'hsl(0,84%,65%)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'hsl(0,84%,70%)' }}>Grading table not found</p>
                <p className="text-xs mb-3" style={{ color: 'hsl(0,84%,55%)' }}>
                  We couldn&apos;t find a grading table in that image. Please upload a clear photo of your university&apos;s grading scale table — not a transcript, syllabus, or other document.
                </p>
                <p className="text-xs mb-2" style={{ color: 'hsl(0,84%,55%)' }}>
                  The table should show: <strong>percentage ranges → letter grades → GPA points</strong>
                </p>
                <button type="button" onClick={() => { setOcrError(null); setGradingFile(null); setPreview(null) }}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={{ background: 'rgba(239,68,68,0.2)', color: 'hsl(0,84%,70%)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  Upload correct image
                </button>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: isLoading ? 'var(--muted)' : 'linear-gradient(135deg, var(--primary), hsl(168,84%,30%))',
            color: 'white',
            boxShadow: isLoading ? 'none' : '0 4px 16px var(--teal-glow)',
          }}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          {isLoading ? 'Processing grading scale...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--muted-foreground)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>Sign in</Link>
      </p>
    </>
  )
}
