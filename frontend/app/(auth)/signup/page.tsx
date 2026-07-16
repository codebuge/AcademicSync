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
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1c1b] tracking-tight mb-2">Create your account</h1>
        <p className="text-sm text-[#3f4944]">Track your GPA and CGPA automatically</p>
      </header>

      {/* Dismissible Amber Alert */}
      {hasDraft && (
        <div className="bg-[#FFF8E1] border border-[#FFECB3] rounded-lg p-3 flex items-start gap-3 mb-6 transition-all duration-300 animate-slide-down">
          <Info className="text-[#FFA000] shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-[#5D4037] flex-1">We saved your GPA calculation — sign up to keep it</p>
          <button 
            type="button" 
            onClick={handleDismissDraft} 
            className="text-[#5D4037] hover:bg-[#FFECB3] rounded-full p-1 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {authError && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-[#ffdad6] border border-[#ffb4a4] text-[#ba1a1a] animate-slide-down">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#3f4944] block" htmlFor="full_name">
            Full Name
          </label>
          <input
            {...register('full_name')}
            type="text"
            id="full_name"
            placeholder="John Doe"
            className={`w-full h-12 px-4 bg-[#F1F1F1] rounded-lg text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-[#005440] border ${
              errors.full_name ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-transparent focus:border-[#005440]'
            }`}
          />
          {errors.full_name && (
            <p className="text-xs text-[#ba1a1a] mt-1">{errors.full_name.message}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#3f4944] block" htmlFor="email">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            placeholder="you@university.edu"
            className={`w-full h-12 px-4 bg-[#F1F1F1] rounded-lg text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-[#005440] border ${
              errors.email ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-transparent focus:border-[#005440]'
            }`}
          />
          {errors.email && (
            <p className="text-xs text-[#ba1a1a] mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#3f4944] block" htmlFor="password">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            id="password"
            placeholder="••••••••"
            className={`w-full h-12 px-4 bg-[#F1F1F1] rounded-lg text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-[#005440] border ${
              errors.password ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-transparent focus:border-[#005440]'
            }`}
          />
          {errors.password && (
            <p className="text-xs text-[#ba1a1a] mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Divider */}
        <div className="relative py-2 flex items-center">
          <div className="flex-grow border-t border-[#bec9c3]/50"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-[#6f7a74] uppercase tracking-wider">
            Grading scale verification
          </span>
          <div className="flex-grow border-t border-[#bec9c3]/50"></div>
        </div>

        {/* Verification Row */}
        <div className="flex gap-4 items-end">
          {/* Dropzone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileChange(f) }}
            onClick={() => fileRef.current?.click()}
            className={`flex-[2] h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer p-2 text-center group transition-all ${
              isDragging 
                ? 'border-[#005440] bg-[#e2f3ee]' 
                : 'border-[#bec9c3] bg-[#F9F9F7] hover:border-[#005440] hover:bg-white'
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
              <img src={preview} alt="Grading scale preview" className="w-full h-full object-cover rounded-md" />
            ) : (
              <>
                <ImageIcon size={20} className="text-[#6f7a74] group-hover:text-[#005440] transition-colors mb-1" />
                <p className="text-xs text-[#1a1c1b] font-semibold">Upload grading scale</p>
                <p className="text-[10px] leading-tight text-[#3f4944] mt-1">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>

          {/* Current Semester */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-[#3f4944] block" htmlFor="current_semester">
              Semester
            </label>
            <input
              {...register('current_semester', { valueAsNumber: true })}
              type="number"
              id="current_semester"
              min="1"
              max="12"
              className="w-full h-20 bg-[#F1F1F1] border-transparent rounded-lg px-4 text-3xl font-bold text-center focus:bg-white focus:ring-1 focus:ring-[#005440] focus:border-[#005440] outline-none"
            />
          </div>
        </div>

        {gradingFile && (
          <p className="text-xs text-[#005440] font-semibold">Selected file: {gradingFile.name}</p>
        )}

        {/* OCR Error Panels */}
        {ocrError === 'GRADING_SCALE_LOW_CONFIDENCE' && (
          <div className="rounded-xl p-4 bg-[#FFF8E1] border border-[#FFECB3] text-[#5D4037] animate-slide-down">
            <div className="flex gap-3">
              <TriangleAlert size={20} className="shrink-0 mt-0.5 text-[#FFA000]" />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">Photo too blurry or unclear</p>
                <p className="text-xs mb-3 text-[#795548]">
                  Try better lighting and make sure the table isn&apos;t tilted or blurry. Hold the camera steady and shoot straight-on.
                </p>
                <p className="text-xs font-semibold mb-2 text-[#795548]">Example of a good photo:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/grading_scale_example.png" alt="Example grading scale photo"
                  className="w-full rounded-lg object-cover" style={{ maxHeight: '120px', border: '1px solid #FFECB3' }} />
                <button 
                  type="button" 
                  onClick={() => { setOcrError(null); setGradingFile(null); setPreview(null) }}
                  className="mt-3 text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#FFE082] hover:bg-[#FFD54F] text-[#5D4037] border border-[#FFD54F] transition-all"
                >
                  Try again with a clearer photo
                </button>
              </div>
            </div>
          </div>
        )}

        {ocrError === 'GRADING_SCALE_MALFORMED' && (
          <div className="rounded-xl p-4 bg-[#ffdad6] border border-[#ffb4a4] text-[#ba1a1a] animate-slide-down">
            <div className="flex gap-3">
              <XCircle size={20} className="shrink-0 mt-0.5 text-[#ba1a1a]" />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">Grading table not found</p>
                <p className="text-xs mb-3 text-[#ba1a1a]/80">
                  We couldn&apos;t find a grading table in that image. Please upload a clear photo of your university&apos;s grading scale table — not a transcript, syllabus, or other document.
                </p>
                <p className="text-xs mb-2 text-[#ba1a1a]/80">
                  The table should show: <strong>percentage ranges → letter grades → GPA points</strong>
                </p>
                <button 
                  type="button" 
                  onClick={() => { setOcrError(null); setGradingFile(null); setPreview(null) }}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#ffb4a4] hover:bg-[#ff8a80] text-[#ba1a1a] border border-[#ff8a80] transition-all"
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
          className="w-full h-14 bg-[#a83820] hover:bg-[#87200a] text-white font-medium text-sm rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
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
      <footer className="mt-6 text-center">
        <p className="text-sm text-[#3f4944]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#005440] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </footer>
    </>
  )
}
