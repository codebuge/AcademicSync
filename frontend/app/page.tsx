'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck, Zap, Laptop, FileDown, Eye, GraduationCap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full mb-6">
          <Sparkles size={14} className="text-[var(--primary)] animate-pulse" />
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Now with AI-powered transcript scanning
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl leading-tight">
          Your GPA, calculated instantly. Your transcript,{' '}
          <span className="gradient-text">verified automatically.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg max-w-2xl" style={{ color: 'var(--muted-foreground)' }}>
          Enter your marks, snap a screenshot, or upload your transcript — AcademicSync tracks your GPA and CGPA in real time, with zero manual math.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Link href="/signup"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white', boxShadow: '0 4px 14px var(--teal-glow)' }}>
            Get started free <ArrowRight size={16} />
          </Link>
          <Link href="/try"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 border"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--foreground)' }}>
            <Sparkles size={16} className="text-[var(--primary)]" />
            Try it free
          </Link>
          <a href="#"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
            style={{ color: 'var(--muted-foreground)' }}>
            <Play size={16} fill="currentColor" />
            See how it works
          </a>
        </div>

        {/* Dashboard Preview mockup */}
        <div className="mt-16 w-full max-w-5xl glass rounded-2xl overflow-hidden border p-1.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="bg-black/40 rounded-xl overflow-hidden aspect-[16/9] relative flex flex-col">
            <div className="bg-white/5 h-10 w-full border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <div className="mx-auto bg-white/5 border border-white/10 rounded-md h-6 w-1/2 flex items-center justify-center text-[10px] text-[var(--muted-foreground)]">
                academicsync.com/dashboard
              </div>
            </div>
            <div className="flex-1 w-full bg-[#030712] flex items-center justify-center p-4 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(45,212,191,0.05)] to-transparent pointer-events-none" />
              {/* Simple illustrative placeholder showing GPA 3.82 */}
              <div className="glass p-8 rounded-2xl text-center max-w-sm w-full animate-fade-in border-white/10">
                <p className="text-xs uppercase tracking-wider font-semibold text-[var(--muted-foreground)]">Your GPA Overview</p>
                <h3 className="text-6xl font-bold mt-2 gradient-text">3.82</h3>
                <p className="text-xs mt-2 px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full inline-block font-medium">Deans List Standing</p>
                <div className="mt-6 flex justify-between text-left border-t border-white/10 pt-4 text-xs text-[var(--muted-foreground)]">
                  <div>
                    <span className="block font-semibold text-white">48.0</span>
                    Credits Verified
                  </div>
                  <div>
                    <span className="block font-semibold text-white">4 Semesters</span>
                    Academic History
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="border-y py-12" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-extrabold text-white">50,000+</div>
            <div className="text-xs mt-1 uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              marks tracked
            </div>
          </div>
          <div>
            <div className="text-4xl font-extrabold gradient-text">98%</div>
            <div className="text-xs mt-1 uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              OCR scanning accuracy
            </div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white flex items-center justify-center gap-1">
              4.8/5
            </div>
            <div className="text-xs mt-1 uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              average student rating
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center tracking-tight mb-16">
          Three ways to track your grades
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Manual entry',
              desc: 'Quickly input assignments and test scores as you get them. Perfect for staying on top of ongoing courses.',
              icon: Zap,
              color: 'var(--primary)',
              bg: 'rgba(45, 212, 191, 0.08)'
            },
            {
              title: 'Screenshot OCR',
              desc: 'Snap a picture of a syllabus or graded paper. Our AI instantly extracts the weights and scores.',
              icon: Eye,
              color: 'var(--secondary)',
              bg: 'rgba(139, 92, 246, 0.08)'
            },
            {
              title: 'Transcript verification',
              desc: "Upload your official PDF transcript. We'll verify past semesters and lock them in as historical data.",
              icon: ShieldCheck,
              color: 'hsl(38, 92%, 50%)',
              bg: 'rgba(245, 158, 11, 0.08)'
            }
          ].map((f, i) => (
            <div key={i} className="glass p-8 rounded-2xl border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col items-start gap-4">
              <div className="p-3.5 rounded-xl" style={{ backgroundColor: f.bg }}>
                <f.icon size={24} style={{ color: f.color }} />
              </div>
              <h3 className="text-xl font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 border-t relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="absolute inset-0 bg-radial-gradient from-[rgba(45,212,191,0.05)] to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Stop calculating your GPA by hand</h2>
          <p className="text-base sm:text-lg max-w-xl" style={{ color: 'var(--muted-foreground)' }}>
            Join thousands of students who have automated their academic tracking.
          </p>
          <Link href="/signup"
            className="mt-4 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))', color: 'white', boxShadow: '0 4px 14px var(--teal-glow)' }}>
            Create your free account
          </Link>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No credit card required · Free forever for basic use</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t px-4" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), hsl(168,84%,28%))' }}>
              <GraduationCap size={14} color="white" />
            </div>
            <span className="font-bold text-sm text-white">AcademicSync</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>

          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            &copy; {new Date().getFullYear()} AcademicSync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
