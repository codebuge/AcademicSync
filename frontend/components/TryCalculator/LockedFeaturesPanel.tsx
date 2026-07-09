'use client'

import { Lock, Sparkles, CheckCircle } from 'lucide-react'

interface LockedFeaturesPanelProps {
  onSignupClick: () => void
}

export default function LockedFeaturesPanel({ onSignupClick }: LockedFeaturesPanelProps) {
  const features = [
    'Unlock automatic transcript uploading (OCR scanner)',
    'Detailed analytics & semester GPA trend charts',
    'Future GPA projection logic & goal tracking',
    'Track up to 12 semesters of academic history',
    'Export grading sheet reports to official PDFs'
  ]

  return (
    <div className="rounded-2xl p-6 border transition-all"
      style={{
        background: 'rgba(45,212,191,0.02)',
        borderColor: 'rgba(45,212,191,0.15)'
      }}>
      <div className="flex gap-4 items-start">
        <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
          <Lock size={20} />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white">Save your calculation & unlock features</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Sign up to save this calculation as your initial semester draft and access complete premium tracking tools.
            </p>
          </div>

          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <CheckCircle size={14} className="text-teal-400 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onSignupClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))',
              color: 'white',
              boxShadow: '0 4px 12px var(--teal-glow)'
            }}>
            <Sparkles size={16} />
            Save Draft & Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
