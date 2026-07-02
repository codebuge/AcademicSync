'use client'

import { getGpaColor } from '@/lib/utils'

interface CGPACardProps {
  cgpa: number
  totalCredits: number
  currentSemester: number
}

export function CGPACard({ cgpa, totalCredits, currentSemester }: CGPACardProps) {
  const glowColor = cgpa >= 3.5 ? 'rgba(45,212,191,0.2)' : cgpa >= 2.5 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'
  const borderColor = cgpa >= 3.5 ? 'rgba(45,212,191,0.3)' : cgpa >= 2.5 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
  const bgGradient = cgpa >= 3.5
    ? 'linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(16,185,129,0.04) 100%)'
    : cgpa >= 2.5
      ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(234,179,8,0.04) 100%)'
      : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(220,38,38,0.04) 100%)'

  return (
    <div
      className="rounded-2xl p-5 h-full hover-lift transition-all duration-200 relative overflow-hidden"
      style={{
        background: bgGradient,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 32px ${glowColor}`,
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10"
        style={{ background: cgpa >= 3.5 ? 'var(--primary)' : cgpa >= 2.5 ? 'hsl(38,92%,50%)' : 'hsl(0,84%,60%)' }}
      />

      <p className="text-xs font-medium mb-2 relative" style={{ color: 'var(--muted-foreground)' }}>
        Cumulative GPA
      </p>

      <p
        className={`text-4xl font-black relative tracking-tight ${getGpaColor(cgpa)}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {cgpa.toFixed(2)}
        <span className="text-base font-normal ml-1" style={{ color: 'var(--muted-foreground)' }}>/4.0</span>
      </p>

      {/* Status label */}
      <div className="mt-2 mb-3">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            background: cgpa >= 3.5 ? 'rgba(45,212,191,0.15)' : cgpa >= 2.5 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
            color: cgpa >= 3.5 ? 'var(--primary)' : cgpa >= 2.5 ? 'hsl(38,92%,60%)' : 'hsl(0,84%,65%)',
          }}
        >
          {cgpa >= 3.5 ? "Dean's List" : cgpa >= 2.5 ? 'Good Standing' : 'Needs Improvement'}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs relative" style={{ color: 'var(--muted-foreground)' }}>
        <span>Sem {currentSemester}</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span>{totalCredits.toFixed(1)} cr verified</span>
      </div>
    </div>
  )
}
