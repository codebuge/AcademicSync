'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  UserPlus, Loader2, TriangleAlert, XCircle, 
  Image as ImageIcon, Sparkles, X, ArrowRight, Info 
} from 'lucide-react'

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
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = sessionStorage.getItem('try_gpa_draft')
      if (draft) {
        setHasDraft(true)
      }
    }
  }, [])

  const handleDismissDraft = () => {
    sessionStorage.removeItem('try_gpa_draft')
    setHasDraft(false)
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({ 
    resolver: zodResolver(signupSchema), 
    defaultValues: { current_semester: 1 } 
  })

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
      const res = await fetch('/api/auth/signup', { method: 'POST', body: formData })
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
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Create your account</h1>
        <p className="text-sm text-slate-400">Track your GPA and CGPA automatically</p>
      </header>

      {/* Dismissible Alert */}
      {hasDraft && (
        <div className="neo-card-sm p-3.5 flex items-start gap-3 mb-5 text-amber-400 animate-slide-down">
          <Info className="shrink-0 mt-0.5 text-amber-400" size={18} />
          <p className="text-xs flex-1 text-slate-300">We saved your GPA calculation — sign up to keep it!</p>
          <button 
            type="button" 
            onClick={handleDismissDraft} 
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {authError && (
        <div className="mb-5 p-3.5 neo-card-sm text-sm text-rose-400 animate-slide-down">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block" htmlFor="full_name">
            Full Name
          </label>
          <input
            {...register('full_name')}
            type="text"
            id="full_name"
            placeholder="John Doe"
            className="w-full h-11 px-4 neo-input text-sm"
          />
          {errors.full_name && (
            <p className="text-xs text-rose-400 mt-1">{errors.full_name.message}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block" htmlFor="email">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            placeholder="you@university.edu"
            className="w-full h-11 px-4 neo-input text-sm"
          />
          {errors.email && (
            <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block" htmlFor="password">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            id="password"
            placeholder="••••••••"
            className="w-full h-11 px-4 neo-input text-sm"
          />
          {errors.password && (
            <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Divider */}
        <div className="relative py-2 flex items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Grading Scale Setup
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Verification Row */}
        <div className="flex gap-3 items-end">
          {/* Dropzone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileChange(f) }}
            onClick={() => fileRef.current?.click()}
            className={`flex-[2] h-24 neo-card-sm flex flex-col items-center justify-center cursor-pointer p-2 text-center group transition-all ${
              isDragging ? 'border-emerald-500 bg-emerald-950/20' : 'hover:border-emerald-500/50'
            }`}
          >
            <input 
              ref={fileRef} 
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }} 
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Grading scale preview" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <>
                <ImageIcon size={20} className="text-slate-400 group-hover:text-emerald-400 transition-colors mb-1" />
                <p className="text-xs text-slate-200 font-semibold">Upload scale photo</p>
                <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>

          {/* Current Semester */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-slate-300 block" htmlFor="current_semester">
              Semester
            </label>
            <input
              {...register('current_semester', { valueAsNumber: true })}
              type="number"
              id="current_semester"
              min="1"
              max="12"
              className="w-full h-24 neo-input text-2xl font-bold text-center text-emerald-400"
            />
          </div>
        </div>

        {gradingFile && (
          <p className="text-xs text-emerald-400 font-medium">Attached: {gradingFile.name}</p>
        )}

        {/* OCR Error Panels */}
        {ocrError === 'GRADING_SCALE_LOW_CONFIDENCE' && (
          <div className="rounded-xl p-4 neo-card-sm text-amber-300 animate-slide-down">
            <div className="flex gap-3">
              <TriangleAlert size={20} className="shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">Image unclear or blurry</p>
                <p className="text-xs mb-3 text-slate-300">
                  Ensure lighting is bright and table is upright.
                </p>
                <button 
                  type="button" 
                  onClick={() => { setOcrError(null); setGradingFile(null); setPreview(null) }}
                  className="neo-button px-3 py-1.5 text-xs text-amber-300 font-semibold"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {ocrError === 'GRADING_SCALE_MALFORMED' && (
          <div className="rounded-xl p-4 neo-card-sm text-rose-300 animate-slide-down">
            <div className="flex gap-3">
              <XCircle size={20} className="shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">Grading table not found</p>
                <p className="text-xs mb-3 text-slate-300">
                  Please upload a clear screenshot of your university grading scale table.
                </p>
                <button 
                  type="button" 
                  onClick={() => { setOcrError(null); setGradingFile(null); setPreview(null) }}
                  className="neo-button px-3 py-1.5 text-xs text-rose-300 font-semibold"
                >
                  Upload correct image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 neo-button-primary mt-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <footer className="mt-6 pt-5 border-t border-slate-800 text-center">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 font-semibold hover:underline ml-1">
            Log in
          </Link>
        </p>
      </footer>
    </>
  )
}
