'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { getGpaColor } from '@/lib/utils'
import { TrendingUp, Target, BarChart3, PieChart, Loader2, AlertCircle, Award, CheckCircle } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, PieChart as RechartsPie, Pie, Cell
} from 'recharts'
import type { PerformanceAnalysisResponse, Mark } from '@/types'

const projectionSchema = z.object({
  target: z.number().min(0).max(4),
  remaining: z.number().min(1).max(12),
})

type ProjectionForm = z.infer<typeof projectionSchema>

const COLORS = ['#2dd4bf', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs" style={{ border: '1px solid var(--border)' }}>
      <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function AnalysisPage() {
  const { user } = useAppStore()
  const [data, setData] = useState<PerformanceAnalysisResponse | null>(null)
  const [marks, setMarks] = useState<Mark[]>([])
  const [loading, setLoading] = useState(true)
  const [projecting, setProjecting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProjectionForm>({
    resolver: zodResolver(projectionSchema),
    defaultValues: { target: 3.5, remaining: 4 },
  })

  const fetchData = useCallback(async (target?: number, remaining?: number) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const base = '/api'
      let url = `${base}/analysis`
      if (target !== undefined && remaining !== undefined) url += `?target=${target}&remaining=${remaining}`
      
      const [analysisRes, marksRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch(`${base}/marks`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      ])

      if (analysisRes.ok) setData(await analysisRes.json())
      if (marksRes.ok) setMarks(await marksRes.json())
    } finally {
      setLoading(false)
      setProjecting(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onProject = async (form: ProjectionForm) => {
    setProjecting(true)
    await fetchData(form.target, form.remaining)
  }

  const chartData = (data?.semesters_performance || []).map(s => ({
    semester: s.semester_name,
    GPA: s.gpa,
    'Verified GPA': s.verified_only_gpa,
  }))

  const verificationData = data ? Object.entries(data.verification_summary)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value })) : []

  // Top courses & courses to review computed from marks
  const sortedByScoreDesc = [...marks].sort((a, b) => b.score - a.score)
  const topCourses = sortedByScoreDesc.slice(0, 5)
  const coursesToReview = [...marks].sort((a, b) => a.score - b.score).slice(0, 3).filter(m => m.score < 80)

  const projection = data?.projection
  const totalVerifiedCredits = marks.filter(m => m.status === 'verified').reduce((sum, m) => sum + m.credit_hours, 0)
  const totalDraftCredits = marks.filter(m => m.status === 'draft').reduce((sum, m) => sum + m.credit_hours, 0)
  const totalPendingCredits = marks.filter(m => m.status === 'pending_verification').reduce((sum, m) => sum + m.credit_hours, 0)
  const totalLockedCredits = marks.filter(m => m.status === 'locked').reduce((sum, m) => sum + m.credit_hours, 0)
  const grandTotalCredits = totalVerifiedCredits + totalDraftCredits + totalPendingCredits + totalLockedCredits

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--muted)', borderTopColor: 'var(--primary)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Performance Analysis</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          CGPA: <strong className={getGpaColor(data?.cgpa ?? 0)}>{(data?.cgpa ?? 0).toFixed(2)}</strong>
          {' · '}{data?.total_courses_count ?? 0} total courses
        </p>
      </div>

      {/* Bento Grid Row 1: Trend & Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CGPA Trend - Area Chart */}
        <div className="lg:col-span-8 glass rounded-2xl p-5 flex flex-col justify-between" style={{ minHeight: '380px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>CGPA Trend</h2>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--primary)' }}></span>
                <span style={{ color: 'var(--muted-foreground)' }}>Your CGPA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5" style={{ borderBottom: '2px dashed rgba(45,212,191,0.5)' }}></span>
                <span style={{ color: 'var(--muted-foreground)' }}>Dean&apos;s List (3.5)</span>
              </div>
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="verifiedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="semester" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={3.5} stroke="rgba(45,212,191,0.3)" strokeDasharray="4 4" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Area type="monotone" dataKey="GPA" stroke="#2dd4bf" fill="url(#gpaGradient)" strokeWidth={2} dot={{ fill: '#2dd4bf', r: 3 }} />
                  <Area type="monotone" dataKey="Verified GPA" stroke="#8b5cf6" fill="url(#verifiedGradient)" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 h-48 rounded-xl"
              style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No semester data yet</p>
            </div>
          )}
        </div>

        {/* Projection Widget */}
        <div className="lg:col-span-4 glass rounded-2xl p-5 flex flex-col justify-between border" style={{ borderColor: 'var(--border)', minHeight: '380px' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} style={{ color: 'var(--primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Projection Tool</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Calculate effort needed to reach your academic goals.
            </p>
            <form onSubmit={handleSubmit(onProject)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Target CGPA</label>
                  <input {...register('target', { valueAsNumber: true })} type="number" step="0.01" min="0" max="4"
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--muted)', border: errors.target ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Remaining Sems</label>
                  <input {...register('remaining', { valueAsNumber: true })} type="number" min="1" max="12"
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
                </div>
              </div>
              <button type="submit" disabled={projecting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 hover-lift"
                style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white' }}>
                {projecting ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                Calculate Target
              </button>
            </form>
          </div>

          {projection && (
            <div className="mt-4 p-4 rounded-xl animate-slide-down border"
              style={{
                background: projection.achievable ? 'rgba(45,212,191,0.08)' : 'rgba(239,68,68,0.08)',
                borderColor: projection.achievable ? 'rgba(45,212,191,0.25)' : 'rgba(239,68,68,0.25)',
              }}>
              <div className="flex items-start gap-3">
                {projection.achievable
                  ? <TrendingUp size={16} className="mt-0.5" style={{ color: 'var(--primary)' }} />
                  : <AlertCircle size={16} className="mt-0.5" style={{ color: 'hsl(0,84%,60%)' }} />
                }
                <div>
                  <p className="text-xs font-semibold mb-0.5"
                    style={{ color: projection.achievable ? 'var(--primary)' : 'hsl(0,84%,70%)' }}>
                    {projection.achievable ? '✓ Achievable Goal' : '⚠ Very Challenging'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    You need a <strong style={{ color: projection.achievable ? 'var(--primary)' : 'hsl(0,84%,70%)' }}>{projection.required_gpa.toFixed(2)} GPA</strong> per semester.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bento Grid Row 2: Top Courses, Review, Credit donut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Top 5 Courses */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Top 5 Courses</h3>
          <div className="space-y-4">
            {topCourses.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No marks logged yet</p>
            ) : topCourses.map(m => (
              <div key={m.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium truncate max-w-[170px]" style={{ color: 'var(--foreground)' }}>{m.course_name}</span>
                  <span className="font-bold text-teal-400">{m.letter_grade || `${m.score}%`}</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: `${m.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Courses to Review */}
        <div className="glass rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Courses to Review</h3>
            <div className="space-y-4 mt-4">
              {coursesToReview.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: 'var(--muted-foreground)' }}>All courses are in good standing! ✨</p>
              ) : coursesToReview.map(m => (
                <div key={m.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate max-w-[170px]" style={{ color: 'var(--foreground)' }}>{m.course_name}</span>
                    <span className="font-bold text-amber-500">{m.letter_grade || `${m.score}%`}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${m.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {coursesToReview.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {coursesToReview.length} course(s) need attention to optimize your academic trajectory.
              </p>
            </div>
          )}
        </div>

        {/* Credit Hours Donut */}
        <div className="glass rounded-2xl p-5 flex flex-col items-center justify-between">
          <h3 className="text-sm font-semibold self-start" style={{ color: 'var(--foreground)' }}>Credit Hours</h3>
          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              {grandTotalCredits > 0 && (
                <>
                  {/* Verified credits */}
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="var(--primary)" strokeWidth="8"
                    strokeDasharray={`${(totalVerifiedCredits / grandTotalCredits) * 251.2} 251.2`} />
                  {/* Pending credits */}
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f59e0b" strokeWidth="8"
                    strokeDasharray={`${(totalPendingCredits / grandTotalCredits) * 251.2} 251.2`}
                    strokeDashoffset={`-${(totalVerifiedCredits / grandTotalCredits) * 251.2}`} />
                  {/* Draft credits */}
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#94a3b8" strokeWidth="8"
                    strokeDasharray={`${(totalDraftCredits / grandTotalCredits) * 251.2} 251.2`}
                    strokeDashoffset={`-${((totalVerifiedCredits + totalPendingCredits) / grandTotalCredits) * 251.2}`} />
                </>
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{grandTotalCredits}</span>
              <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Total cr</span>
            </div>
          </div>

          <div className="w-full space-y-2 mt-2">
            {[
              { label: 'Verified', value: totalVerifiedCredits, color: 'var(--primary)' },
              { label: 'Pending', value: totalPendingCredits, color: '#f59e0b' },
              { label: 'Draft', value: totalDraftCredits, color: '#94a3b8' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }}></span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                </div>
                <span className="font-bold" style={{ color: 'var(--foreground)' }}>{value} cr</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
