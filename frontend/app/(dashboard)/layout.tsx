'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { LayoutDashboard, BookOpen, FileText, TrendingUp, LogOut, Menu, X, GraduationCap, ChevronRight } from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/marks', icon: BookOpen, label: 'Marks' },
  { href: '/transcript', icon: FileText, label: 'Transcript' },
  { href: '/analysis', icon: TrendingUp, label: 'Analysis' },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearStore } = useAppStore()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearStore()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))' }}>
          <GraduationCap size={20} color="white" />
        </div>
        <span className="font-bold text-lg gradient-text">AcademicSync</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-white/5 transition-colors">
            <X size={18} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
              style={{
                background: isActive ? 'rgba(45,212,191,0.12)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                border: isActive ? '1px solid rgba(45,212,191,0.2)' : '1px solid transparent',
              }}>
              <Icon size={18} />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto" style={{ color: 'var(--primary)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      {user && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{user.full_name || user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--primary)' }}>
                {user.role}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Sem {user.current_semester}</span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-red-500/10 group"
            style={{ color: 'var(--muted-foreground)' }}>
            <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
            <span className="group-hover:text-red-400 transition-colors">Sign out</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, setUser, semesterGuardVisible, hideSemesterGuard } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    if (user) { setLoading(false); return }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/users/me`, {
        headers: { Authorization: `Bearer ${data.user.id}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(profile => { if (profile) setUser(profile) })
        .finally(() => setLoading(false))
    })
  }, [user, router, setUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--muted)', borderTopColor: 'var(--primary)' }} />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 glass"
        style={{ borderRight: '1px solid var(--border)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 glass animate-slide-up"
            style={{ borderRight: '1px solid var(--border)' }}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="glass h-14 flex items-center gap-4 px-4 lg:px-6 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <button className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(true)}>
            <Menu size={20} style={{ color: 'var(--foreground)' }} />
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
                {user.email}
              </span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white' }}>
                {(user.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
            </div>
          )}
        </header>

        {/* Semester guard banner */}
        {semesterGuardVisible && (
          <div className="flex items-center gap-3 px-4 py-2.5 text-sm animate-slide-down"
            style={{ background: 'rgba(45,212,191,0.1)', borderBottom: '1px solid rgba(45,212,191,0.2)', color: 'var(--primary)' }}>
            <FileText size={16} />
            <span className="flex-1">Transcript upload unlocks in Semester 2. Complete your first semester to enable this feature.</span>
            <button onClick={hideSemesterGuard} className="hover:opacity-70 transition-opacity">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
