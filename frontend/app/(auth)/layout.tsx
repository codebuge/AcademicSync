'use client'

import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-12 relative overflow-hidden bg-[#131a26] text-slate-100">
      {/* Neomorphic ambient lights */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.06) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 45%)'
        }}
      />

      <main className="w-full max-w-[460px] flex flex-col items-center z-10 animate-fade-in">
        {/* Logo Branding */}
        <Link href="/" className="flex items-center gap-3 mb-8 group">
          <div className="w-12 h-12 neo-card flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <GraduationCap size={24} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Academic<span className="text-emerald-400">Sync</span></span>
        </Link>

        {/* Neomorphic Card wrapper */}
        <div className="w-full neo-card p-8 md:p-10 border border-slate-700/30">
          {children}
        </div>
      </main>
    </div>
  )
}
