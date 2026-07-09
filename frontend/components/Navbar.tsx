'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Sparkles, X, Menu } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-40 glass"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <span className="font-bold text-base gradient-text">AcademicSync</span>
          </Link>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            {['Features', 'Methodology', 'Support'].map(l => (
              <a key={l} href="#" className="text-sm transition-colors duration-200"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}>
                {l}
              </a>
            ))}
          </div>

          <div className="flex-1" />

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium transition-colors"
              style={{ color: 'var(--muted-foreground)' }}>
              Log in
            </Link>
            <Link href="/try"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
              <Sparkles size={14} />
              Try it free
            </Link>
            <Link href="/signup"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white', boxShadow: '0 4px 14px var(--teal-glow)' }}>
              Sign up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-xl transition-colors"
            style={{ color: 'var(--foreground)' }}
            onClick={() => setOpen(true)}
            aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 glass animate-slide-up flex flex-col"
            style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-bold gradient-text">AcademicSync</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1 flex-1">
              {['Features', 'Methodology', 'Support'].map(l => (
                <a key={l} href="#" onClick={() => setOpen(false)}
                  className="flex items-center h-11 px-3 rounded-xl text-sm transition-colors"
                  style={{ color: 'var(--foreground)' }}>
                  {l}
                </a>
              ))}
              <div className="my-3" style={{ height: '1px', background: 'var(--border)' }} />
              <Link href="/login" onClick={() => setOpen(false)}
                className="flex items-center justify-center h-11 rounded-xl text-sm font-medium"
                style={{ color: 'var(--primary)' }}>
                Log in
              </Link>
              <Link href="/try" onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium transition-all"
                style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                <Sparkles size={14} /> Try it free
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)}
                className="flex items-center justify-center h-11 rounded-xl text-sm font-medium mt-1"
                style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white', boxShadow: '0 4px 14px var(--teal-glow)' }}>
                Sign up
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
