'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import CourseRow from '@/components/TryCalculator/CourseRow'
import ResultCard from '@/components/TryCalculator/ResultCard'
import LockedFeaturesPanel from '@/components/TryCalculator/LockedFeaturesPanel'
import { Plus, Sparkles, Loader2, AlertCircle } from 'lucide-react'

interface CourseInput {
  courseName: string
  creditHours: string
  score: string
}

interface CourseError {
  courseName?: string
  creditHours?: string
  score?: string
}

interface ApiResponse {
  gpa: number
  total_credit_hours: number
  course_breakdown: Array<{
    course_name: string
    letter_grade: string
    grade_points: number
  }>
}

export default function TryCalculatorPage() {
  const router = useRouter()
  const [scale, setScale] = useState<'4.0' | '5.0' | 'percentage'>('4.0')
  const [courses, setCourses] = useState<CourseInput[]>([
    { courseName: '', creditHours: '', score: '' },
    { courseName: '', creditHours: '', score: '' },
    { courseName: '', creditHours: '', score: '' }
  ])
  const [errors, setErrors] = useState<CourseError[]>([])
  const [calcResult, setCalcResult] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleAddRow = () => {
    if (courses.length >= 20) return
    setCourses([...courses, { courseName: '', creditHours: '', score: '' }])
    if (errors.length) setErrors([...errors, {}])
  }

  const handleRemoveRow = (index: number) => {
    if (courses.length <= 1) return
    const newCourses = courses.filter((_, i) => i !== index)
    setCourses(newCourses)
    if (errors.length) {
      const newErrors = errors.filter((_, i) => i !== index)
      setErrors(newErrors)
    }
  }

  const handleCourseChange = (
    index: number,
    field: 'courseName' | 'creditHours' | 'score',
    value: string
  ) => {
    const newCourses = [...courses]
    newCourses[index] = { ...newCourses[index], [field]: value }
    setCourses(newCourses)

    // Clear error for this field
    if (errors[index]) {
      const newErrors = [...errors]
      newErrors[index] = { ...newErrors[index], [field]: undefined }
      setErrors(newErrors)
    }
  }

  const validateInputs = (): boolean => {
    const newErrors: CourseError[] = courses.map(() => ({}))
    let hasError = false

    courses.forEach((c, idx) => {
      // Validate Course Name
      if (!c.courseName.trim()) {
        newErrors[idx].courseName = 'Course name is required'
        hasError = true
      }

      // Validate Credit Hours
      const ch = parseFloat(c.creditHours)
      if (isNaN(ch) || ch < 0.5 || ch > 6.0) {
        newErrors[idx].creditHours = 'Must be between 0.5 and 6.0'
        hasError = true
      }

      // Validate Score
      const sc = parseFloat(c.score)
      if (isNaN(sc) || sc < 0 || sc > 100) {
        newErrors[idx].score = 'Must be between 0 and 100'
        hasError = true
      }
    })

    setErrors(newErrors)
    return !hasError
  }

  const handleCalculate = async () => {
    setApiError(null)
    if (!validateInputs()) return

    setLoading(true)
    try {
      const res = await fetch('/api/public/gpa-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses: courses.map(c => ({
            course_name: c.courseName.trim(),
            credit_hours: parseFloat(c.creditHours),
            score: parseFloat(c.score)
          })),
          grading_scale: scale
        })
      })

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After')
        setApiError(`Too many requests. Please try again in ${retryAfter || '60'} seconds.`)
        setLoading(false)
        return
      }

      const body = await res.json()
      if (!res.ok) {
        setApiError(body.detail || 'An error occurred during calculation.')
        setLoading(false)
        return
      }

      setCalcResult(body)
    } catch {
      setApiError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupHandoff = () => {
    if (!calcResult) return
    const draft = {
      courses: courses.map(c => ({
        course_name: c.courseName.trim(),
        score: parseFloat(c.score),
        credit_hours: parseFloat(c.creditHours),
        semester: 'Semester 1',
        max_score: 100.0
      })),
      gpa: calcResult.gpa
    }
    sessionStorage.setItem('try_gpa_draft', JSON.stringify(draft))
    router.push('/signup')
  }

  const hasAtLeastOneFilledRow = courses.some(
    c => c.courseName.trim() || c.creditHours || c.score
  )

  return (
    <div className="min-h-screen pb-24 bg-[#131a26] text-slate-100">
      <Navbar />

      <main className="pt-28 px-4 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="neo-badge inline-flex items-center px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles size={14} className="mr-1.5" />
            No sign-up required
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Calculate your GPA <span className="gradient-text">instantly</span>
          </h1>
          <p className="text-sm max-w-xl mx-auto text-slate-400">
            Input your courses below to instantly calculate your weighted GPA. Sign up anytime to lock in your score history.
          </p>
        </div>

        {/* Form Container */}
        <div className="neo-card p-6 space-y-6">
          {/* Scale selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 text-slate-400">
              Grading Scale System
            </label>
            <div className="grid grid-cols-3 p-1.5 neo-card-sm">
              {[
                { id: '4.0', label: '4.0 Scale' },
                { id: '5.0', label: '5.0 Scale' },
                { id: 'percentage', label: 'Percentage' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScale(opt.id as any)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    scale === opt.id
                      ? 'neo-button-primary'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Courses table / list header */}
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-semibold uppercase tracking-wider pb-2 border-b border-slate-700/50 text-slate-400">
              <div className="col-span-6">Course Name</div>
              <div className="col-span-3">Credits</div>
              <div className="col-span-2">Score (%)</div>
              <div className="col-span-1"></div>
            </div>

            {/* Course Rows */}
            <div className="space-y-3 md:space-y-4">
              {courses.map((course, idx) => (
                <CourseRow
                  key={idx}
                  index={idx}
                  courseName={course.courseName}
                  creditHours={course.creditHours}
                  score={course.score}
                  errors={errors[idx]}
                  onChange={handleCourseChange}
                  onRemove={handleRemoveRow}
                />
              ))}
            </div>
          </div>

          {/* Table Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-700/50">
            <button
              type="button"
              onClick={handleAddRow}
              disabled={courses.length >= 20}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus size={16} /> Add Course Row ({courses.length}/20)
            </button>

            {apiError && (
              <div className="neo-card-sm flex items-center gap-2 p-2.5 text-xs text-red-400 border border-red-500/20">
                <AlertCircle size={14} className="shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCalculate}
              disabled={loading || !hasAtLeastOneFilledRow}
              className="w-full sm:w-auto neo-button-primary flex items-center justify-center gap-2 py-3 px-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? 'Calculating...' : 'Calculate GPA'}
            </button>
          </div>
        </div>

        {/* Calculation Result */}
        {calcResult && (
          <ResultCard
            gpa={calcResult.gpa}
            totalCreditHours={calcResult.total_credit_hours}
            breakdown={calcResult.course_breakdown as any}
          />
        )}

        {/* Locked features CTA */}
        {calcResult && (
          <LockedFeaturesPanel onSignupClick={handleSignupHandoff} />
        )}
      </main>
    </div>
  )
}
