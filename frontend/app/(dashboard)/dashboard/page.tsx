'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { TrendingUp, BookOpen, Award, Calendar, ArrowUpRight, BarChart3 } from 'lucide-react'
import { getGpaColor } from '@/lib/utils'
import { GPAChart } from '@/components/GPAChart'
import { CGPACard } from '@/components/CGPACard'
import { StatusBadge } from '@/components/StatusBadge'
import type { CgpaResponse, Mark, SemesterAnalysis } from '@/types'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAppStore()
  const [cgpa, setCgpa] = useState<CgpaResponse | null>(null)
  const [marks, setMarks] = useState<Mark[]>([])
  const [semesters, setSemesters] = useState<SemesterAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const base = '/api'
      const token = session.access_token
      const headers = { Authorization: `Bearer ${token}` }

      const [cgpaRes, marksRes, analysisRes] = await Promise.all([
        // Check for try_gpa_draft to ingest
        (async () => {
          if (typeof window !== 'undefined') {
            const draftStr = sessionStorage.getItem('try_gpa_draft')
            if (draftStr) {
              try {
                const draft = JSON.parse(draftStr)
                if (draft && Array.isArray(draft.courses) && draft.courses.length > 0) {
                  // Post courses sequentially or parallel
                  await Promise.all(
                    draft.courses.map((course: any) =>
                      fetch(`${base}/marks`, {
                        method: 'POST',
                        headers: {
                          ...headers,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(course)
                      })
                    )
                  )
                }
              } catch (e) {
                console.error('Failed to ingest draft courses:', e)
              } finally {
                sessionStorage.removeItem('try_gpa_draft')
              }
            }
          }
        })().then(() => fetch(`${base}/cgpa`, { headers })),
        fetch(`${base}/marks`, { headers }),
        fetch(`${base}/analysis`, { headers }),
      ])


      if (cgpaRes.ok) setCgpa(await cgpaRes.json())
      if (marksRes.ok) setMarks(await marksRes.json())
      if (analysisRes.ok) {
        const data = await analysisRes.json()
        setSemesters(data.semesters_performance || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const verifiedMarks = marks.filter(m => m.status === 'verified')
  const recentMarks = [...marks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
  const latestGpa = semesters.length ? semesters[semesters.length - 1].gpa : 0


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--muted)', borderTopColor: 'var(--primary)' }} />
      </div>
    )
  }

  const chartData = semesters.map(s => ({
    semester: s.semester_name,
    gpa: s.gpa,
    cgpa_at_time: cgpa?.cgpa ?? 0,
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Here&apos;s your academic snapshot</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CGPA Card */}
        <div className="col-span-2 lg:col-span-1">
          <CGPACard
            cgpa={cgpa?.cgpa ?? 0}
            totalCredits={cgpa?.total_verified_credits ?? 0}
            currentSemester={user?.current_semester ?? 1}
          />
        </div>

        {[
          { label: 'Current Semester', value: `Sem ${user?.current_semester ?? 1}`, icon: Calendar, color: 'var(--secondary)' },
          { label: 'Verified Credits', value: cgpa?.total_verified_credits?.toFixed(1) ?? '0', icon: Award, color: 'var(--primary)' },
          { label: 'Latest GPA', value: latestGpa.toFixed(2), icon: TrendingUp, color: latestGpa >= 3.5 ? 'hsl(160,84%,50%)' : latestGpa >= 2.5 ? 'hsl(38,92%,50%)' : 'hsl(0,84%,60%)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-5 hover-lift transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              <div className="p-2 rounded-xl" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Recent Marks */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>GPA Trend</h2>
            <BarChart3 size={16} style={{ color: 'var(--muted-foreground)' }} />
          </div>
          {chartData.length > 0 ? (
            <GPAChart data={chartData} />
          ) : (
            <div className="flex items-center justify-center h-48 rounded-xl"
              style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No semester data yet</p>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Recent Marks</h2>
            <Link href="/marks" className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--primary)' }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentMarks.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>No marks yet</p>
            ) : recentMarks.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
                style={{ border: '1px solid var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{m.course_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{m.semester}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold ${getGpaColor(m.score / 25)}`}>{m.score}%</p>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Mark', href: '/marks', icon: BookOpen, desc: 'Manual or OCR' },
          { label: 'Upload Transcript', href: '/transcript', icon: Award, desc: `Sem ${user?.current_semester ?? 1}${(user?.current_semester ?? 1) < 2 ? ' · Locked' : ''}` },
          { label: 'View Analysis', href: '/analysis', icon: TrendingUp, desc: 'Trends & projections' },
          { label: 'Total Marks', href: '/marks', icon: BarChart3, desc: `${marks.length} courses` },
        ].map(({ label, href, icon: Icon, desc }) => (
          <Link key={label} href={href}
            className="glass rounded-2xl p-4 flex flex-col gap-2 hover-lift transition-all duration-200 group">
            <Icon size={18} style={{ color: 'var(--primary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
