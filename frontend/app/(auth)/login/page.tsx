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
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h2>
        <p className="text-sm text-slate-400">Log in to view your GPA dashboard</p>
      </header>

      {registered && (
        <div className="mb-5 p-3.5 neo-card-sm text-sm flex gap-3 items-center text-emerald-400 animate-slide-down">
          <CheckCircle size={18} className="shrink-0" />
          <span>Account created successfully! Please log in.</span>
        </div>
      )}

      {authError && (
        <div className="mb-5 p-3.5 neo-card-sm text-sm text-rose-400 animate-slide-down">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block" htmlFor="email">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            placeholder="student@university.edu"
            className="w-full h-12 px-4 neo-input text-sm"
          />
          {errors.email && (
            <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-emerald-400 hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="••••••••"
              className="w-full h-12 px-4 pr-12 neo-input text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 neo-button-primary mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
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

      <footer className="mt-8 pt-6 border-t border-slate-800 text-center">
        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-emerald-400 font-semibold hover:underline ml-1">
            Sign up free
          </Link>
        </p>
      </footer>
    </>
  )
}
