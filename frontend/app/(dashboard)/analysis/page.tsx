'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { getGpaColor } from '@/lib/utils'
import { TrendingUp, Target, BarChart3, PieChart, Loader2, AlertCircle } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, PieChart as RechartsPie, Pie, Cell
} from 'recharts'
import type { PerformanceAnalysisResponse } from '@/types'

const projectionSchema = z.object({
  target: z.number().min(0).max(4),
  remaining: z.number().min(1).max(12),
})

type ProjectionForm = z.infer<typeof projectionSchema>

const COLORS = ['#2dd4bf', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [loading, setLoading] = useState(true)
  const [projecting, setProjecting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProjectionForm>({
    resolver: zodResolver(projectionSchema),
    defaultValues: { target: 3.5, remaining: 4 },
  })

  const fetchAnalysis = useCallback(async (target?: number, remaining?: number) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      let url = `${base}/analysis`
      if (target !== undefined && remaining !== undefined) url += `?target=${target}&remaining=${remaining}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setData(await res.json())
    } finally { setLoading(false); setProjecting(false) }
  }, [])

  useEffect(() => { fetchAnalysis() }, [fetchAnalysis])

  const onProject = async (form: ProjectionForm) => {
    setProjecting(true)
    await fetchAnalysis(form.target, form.remaining)
  }

  const chartData = (data?.semesters_performance || []).map(s => ({
    semester: s.semester_name,
    GPA: s.gpa,
    'Verified GPA': s.verified_only_gpa,
  }))

  const verificationData = data ? Object.entries(data.verification_summary)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value })) : []

  const topCourses = (data?.semesters_performance || []).slice(0, 5)
  const projection = data?.projection

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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Analysis</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          CGPA: <strong className={getGpaColor(data?.cgpa ?? 0)}>{(data?.cgpa ?? 0).toFixed(2)}</strong>
          {' · '}{data?.total_courses_count ?? 0} total courses
        </p>
      </div>

      {/* CGPA Trend - Area Chart */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>CGPA Trend</h2>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
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
              <ReferenceLine y={3.5} stroke="rgba(45,212,191,0.3)" strokeDasharray="4 4"
                label={{ value: "Dean's List", fill: 'var(--primary)', fontSize: 10, position: 'insideTopRight' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Area type="monotone" dataKey="GPA" stroke="#2dd4bf" fill="url(#gpaGradient)" strokeWidth={2} dot={{ fill: '#2dd4bf', r: 3 }} />
              <Area type="monotone" dataKey="Verified GPA" stroke="#8b5cf6" fill="url(#verifiedGradient)" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 rounded-xl"
            style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No semester data yet</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Projection Widget */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>CGPA Projection</h2>
          </div>
          <form onSubmit={handleSubmit(onProject)} className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Target CGPA</label>
                <input {...register('target', { valueAsNumber: true })} type="number" step="0.01" min="0" max="4"
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--muted)', border: errors.target ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Remaining Sems</label>
                <input {...register('remaining', { valueAsNumber: true })} type="number" min="1" max="12"
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }} />
              </div>
            </div>
            <button type="submit" disabled={projecting}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white' }}>
              {projecting ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
              Calculate
            </button>
          </form>

          {projection && (
            <div className="p-4 rounded-xl animate-slide-down"
              style={{
                background: projection.achievable ? 'rgba(45,212,191,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${projection.achievable ? 'rgba(45,212,191,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
              <div className="flex items-start gap-3">
                {projection.achievable
                  ? <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                  : <AlertCircle size={18} style={{ color: 'hsl(0,84%,60%)' }} />
                }
                <div>
                  <p className="text-sm font-semibold mb-1"
                    style={{ color: projection.achievable ? 'var(--primary)' : 'hsl(0,84%,70%)' }}>
                    {projection.achievable ? '✓ Achievable' : '⚠ Very Challenging'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Required GPA per semester: <strong className={projection.achievable ? 'text-emerald-400' : 'text-red-400'}>
                      {projection.required_gpa.toFixed(2)}
                    </strong>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    Target: {projection.target_cgpa.toFixed(2)} · Remaining: {projection.remaining_semesters} semesters
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mark Status Distribution */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} style={{ color: 'var(--secondary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Mark Status Distribution</h2>
          </div>
          {verificationData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <RechartsPie>
                  <Pie data={verificationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {verificationData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-2">
                {verificationData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs capitalize" style={{ color: 'var(--muted-foreground)' }}>
                      {entry.name.replace('_', ' ')}: <strong style={{ color: 'var(--foreground)' }}>{entry.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-xl"
              style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No mark data yet</p>
            </div>
          )}
        </div>

        {/* Semester GPA Bar Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: 'var(--secondary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Semester Performance</h2>
          </div>
          {topCourses.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topCourses.map(s => ({ semester: s.semester_name, GPA: s.gpa, Credits: s.credits }))}
                margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="semester" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar dataKey="GPA" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-xl"
              style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Add marks to see semester performance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
