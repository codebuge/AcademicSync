'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [registered, setRegistered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('registered') === '1') {
        setRegistered(true)
      }
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setAuthError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        setAuthError(error.message)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1a1c1b] tracking-tight mb-2">Welcome back</h2>
        <p className="text-sm text-[#3f4944]">Log in to see your latest GPA</p>
      </header>

      {registered && (
        <div className="mb-4 p-3 rounded-lg text-sm flex gap-2.5 items-start bg-[#e2f3ee] border border-[#a0f3d4] text-[#00513e] animate-slide-down">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          <span>Account created successfully! Sign in to continue.</span>
        </div>
      )}

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
          <input
            {...register('email')}
            type="email"
            id="email"
            placeholder="student@university.edu"
            className={`w-full h-12 px-4 bg-[#F1F1F1] rounded-lg text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-[#005440] border ${
              errors.email ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-transparent focus:border-[#005440]'
            }`}
          />
          {errors.email && (
            <p className="text-xs text-[#ba1a1a] mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1 relative">
          <label className="text-sm font-medium text-[#3f4944] block" htmlFor="password">
            Password
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
          <div className="flex justify-end pt-1">
            <Link href="#" className="text-sm font-medium text-[#005440] hover:underline">
              Forgot password?
            </Link>
          </div>
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
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <span>Log in</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <footer className="mt-6 pt-6 border-t border-[#bec9c3]/30 text-center">
        <p className="text-sm text-[#3f4944]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#005440] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </footer>
    </>
  )
}
