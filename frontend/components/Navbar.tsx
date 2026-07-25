'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Sparkles, X, Menu } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-40 bg-[#131a26]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 neo-card-sm flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Academic<span className="text-emerald-400">Sync</span></span>
          </Link>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-2">
            {['Features', 'Methodology', 'Support'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800/40 rounded-xl transition-all">
                {l}
              </a>
            ))}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/try"
              className="flex items-center gap-2 px-4 py-2 neo-button text-sm font-medium">
              <Sparkles size={14} className="text-emerald-400" />
              <span>Try Free</span>
            </Link>
            <Link href="/signup"
              className="px-5 py-2 neo-button-primary text-sm">
              Sign up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2.5 neo-button"
            onClick={() => setOpen(true)}
            aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 neo-card rounded-none border-l border-slate-700/50 flex flex-col p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
              <span className="font-bold text-lg text-white">Academic<span className="text-emerald-400">Sync</span></span>
              <button onClick={() => setOpen(false)} className="p-2 neo-button" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-3 flex-1">
              {['Features', 'Methodology', 'Support'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}
                  className="px-4 py-3 neo-card-sm text-sm font-medium text-slate-200 hover:text-emerald-400">
                  {l}
                </a>
              ))}
              <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-800">
                <Link href="/login" onClick={() => setOpen(false)}
                  className="w-full text-center py-3 neo-button text-sm font-medium">
                  Log in
                </Link>
                <Link href="/try" onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 neo-button text-sm font-medium text-emerald-400">
                  <Sparkles size={16} /> Try it free
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}
                  className="w-full text-center py-3 neo-button-primary text-sm">
                  Sign up
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
