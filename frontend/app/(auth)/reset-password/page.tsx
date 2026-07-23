'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingSession, setIsVerifyingSession] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) })

  useEffect(() => {
    const supabase = createClient()

    const handleRecoverySession = async () => {
      try {
        // Check for PKCE code in URL query params
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setAuthError('Invalid or expired reset link. Please request a new password reset.')
          }
        } else {
          // Check existing session or URL hash fragment
          const { data: { session } } = await supabase.auth.getSession()
          if (!session && !window.location.hash.includes('access_token')) {
            setAuthError('No active recovery session found. Please click the reset link in your email again.')
          }
        }
      } catch {
        setAuthError('Failed to verify recovery link.')
      } finally {
        setIsVerifyingSession(false)
      }
    }

    handleRecoverySession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setAuthError(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    setAuthError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2500)
    } catch {
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1a1c1b] tracking-tight mb-2">Create New Password</h2>
        <p className="text-sm text-[#3f4944]">Enter your new password below to secure your account</p>
      </header>

      {isVerifyingSession ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-[#3f4944]">
          <Loader2 size={28} className="animate-spin text-[#005440]" />
          <p className="text-sm font-medium">Verifying reset link...</p>
        </div>
      ) : success ? (
        <div className="p-4 rounded-xl text-sm flex flex-col items-center text-center gap-3 bg-[#e2f3ee] border border-[#a0f3d4] text-[#00513e] animate-slide-down">
          <div className="w-10 h-10 rounded-full bg-[#00513e]/10 flex items-center justify-center">
            <CheckCircle size={24} className="text-[#00513e]" />
          </div>
          <div>
            <p className="font-semibold text-base mb-1">Password updated!</p>
            <p className="text-xs text-[#00513e]/80">
              Your password has been changed successfully. Redirecting you to login...
            </p>
          </div>
        </div>
      ) : (
        <>
          {authError && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-[#ffdad6] border border-[#ffb4a4] text-[#ba1a1a] animate-slide-down">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password */}
            <div className="space-y-1 relative">
              <label className="text-sm font-medium text-[#3f4944] block" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  className={`w-full h-12 px-4 pr-12 bg-[#F1F1F1] rounded-lg text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-[#005440] border ${
                    errors.password ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-transparent focus:border-[#005440]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3f4944] hover:text-[#005440] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#ba1a1a] mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#3f4944] block" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="••••••••"
                className={`w-full h-12 px-4 bg-[#F1F1F1] rounded-lg text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-[#005440] border ${
                  errors.confirmPassword ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-transparent focus:border-[#005440]'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-[#ba1a1a] mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#E8664A] hover:bg-[#D55A3F] text-white font-medium text-sm rounded-lg transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Save new password</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </>
  )
}
