'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Welcome back</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>Sign in to your account</p>

      {authError && (
        <div className="mb-4 p-3 rounded-lg text-sm animate-slide-down"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'hsl(0,84%,70%)' }}>
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
            Email address
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@university.edu"
            className="w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
            style={{
              background: 'var(--muted)',
              border: errors.email ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
          {errors.email && <p className="text-xs mt-1" style={{ color: 'hsl(0,84%,60%)' }}>{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm transition-all duration-200"
              style={{
                background: 'var(--muted)',
                border: errors.password ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--muted-foreground)' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs mt-1" style={{ color: 'hsl(0,84%,60%)' }}>{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: isLoading ? 'var(--muted)' : 'linear-gradient(135deg, var(--primary), hsl(168,84%,30%))',
            color: 'white',
            boxShadow: isLoading ? 'none' : '0 4px 16px var(--teal-glow)',
          }}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium transition-colors hover:underline" style={{ color: 'var(--primary)' }}>
          Create account
        </Link>
      </p>
    </>
  )
}
