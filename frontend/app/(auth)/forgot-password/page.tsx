'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Loader2, CheckCircle, ArrowRight, ArrowLeft, Mail } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [authError, setAuthError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) })

  // Check URL query string or hash fragment for errors from Supabase (e.g. otp_expired)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))

    const errorCode = urlParams.get('error_code') || hashParams.get('error_code')
    const errorDesc = urlParams.get('error_description') || hashParams.get('error_description')

    if (errorCode === 'otp_expired' || errorDesc?.includes('expired')) {
      setAuthError('Your password reset link has expired or was already used. Please enter your email below to receive a new link.')
    } else if (errorDesc) {
      setAuthError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')))
    }
  }, [])

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setAuthError(null)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      setSuccess(true)
    } catch {
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1a1c1b] tracking-tight mb-2">Reset Password</h2>
        <p className="text-sm text-[#3f4944]">Enter your email to receive a password reset link</p>
      </header>

      {success ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl text-sm flex flex-col items-center text-center gap-3 bg-[#e2f3ee] border border-[#a0f3d4] text-[#00513e] animate-slide-down">
            <div className="w-10 h-10 rounded-full bg-[#00513e]/10 flex items-center justify-center">
              <CheckCircle size={24} className="text-[#00513e]" />
            </div>
            <div>
              <p className="font-semibold text-base mb-1">Reset link sent!</p>
              <p className="text-xs text-[#00513e]/80">
                If an account exists for that email, we&apos;ve sent instructions to reset your password. Please check your inbox and spam folder.
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full h-12 bg-[#005440] hover:bg-[#003e2f] text-white font-medium text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            <span>Return to login</span>
          </Link>
        </div>
      ) : (
        <>
          {authError && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-[#ffdad6] border border-[#ffb4a4] text-[#ba1a1a] animate-slide-down">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#3f4944] block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder="student@university.edu"
                  className={`w-full h-12 px-4 pr-10 bg-[#F1F1F1] rounded-lg text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-[#005440] border ${
                    errors.email ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-transparent focus:border-[#005440]'
                  }`}
                />
                <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3f4944]/60 pointer-events-none" />
              </div>
              {errors.email && (
                <p className="text-xs text-[#ba1a1a] mt-1">{errors.email.message}</p>
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
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send reset link</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <footer className="mt-6 pt-6 border-t border-[#bec9c3]/30 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#005440] hover:underline">
              <ArrowLeft size={16} />
              <span>Back to log in</span>
            </Link>
          </footer>
        </>
      )}
    </>
  )
}
