'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck, Zap, Laptop, FileDown, Eye, Check, GraduationCap, Menu, X } from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen font-sans selection:bg-[#0F6E56]/10 selection:text-[#0F6E56]" style={{ backgroundColor: '#FAFAF8', color: '#1A1A1A' }}>
      
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md transition-all duration-200 border-b border-[#1A1A1A]/5 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0F6E56] text-white">
              <GraduationCap size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#1A1A1A] group-hover:text-[#0F6E56] transition-colors">
              AcademicSync
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-[#1A1A1A]/70 hover:text-[#0F6E56] transition-colors">Features</a>
            <a href="#how-it-works" className="text-[#1A1A1A]/70 hover:text-[#0F6E56] transition-colors">How it works</a>
            <a href="#semester-guard" className="text-[#1A1A1A]/70 hover:text-[#0F6E56] transition-colors">For universities</a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-[#1A1A1A]/80 hover:text-[#0F6E56] transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="px-4 py-2 rounded-lg font-semibold text-sm bg-[#E8664A] text-white hover:bg-[#E8664A]/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-sm shadow-[#E8664A]/25">
              Sign up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <Menu size={22} className="text-[#1A1A1A]" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-6 shadow-2xl flex flex-col justify-between" onClick={e => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1A1A1A]">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5">
                  <X size={20} className="text-[#1A1A1A]" />
                </button>
              </div>
              <nav className="flex flex-col gap-4 text-base font-semibold">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-[#1A1A1A]/70 hover:text-[#0F6E56] py-1">Features</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-[#1A1A1A]/70 hover:text-[#0F6E56] py-1">How it works</a>
                <a href="#semester-guard" onClick={() => setMobileMenuOpen(false)} className="text-[#1A1A1A]/70 hover:text-[#0F6E56] py-1">For universities</a>
              </nav>
            </div>
            <div className="space-y-3 pb-8">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-2.5 rounded-lg font-medium text-sm border border-[#1A1A1A]/10 text-[#1A1A1A]/80 hover:bg-[#FAFAF8]">
                Log in
              </Link>
              <Link href="/try" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-2.5 rounded-lg font-medium text-sm bg-[#0F6E56]/5 text-[#0F6E56] hover:bg-[#0F6E56]/10">
                Try it free
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-2.5 rounded-lg font-semibold text-sm bg-[#E8664A] text-white hover:bg-[#E8664A]/90">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 px-4 max-w-7xl mx-auto lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 bg-[#E8664A]/10 border border-[#E8664A]/20 px-3.5 py-1.5 rounded-full">
            <span className="text-xs font-semibold text-[#E8664A]">Now with AI-powered transcript scanning</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
            Your GPA, calculated instantly. Your transcript,{' '}
            <span className="text-[#0F6E56]">verified automatically.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#1A1A1A]/70 max-w-xl leading-relaxed">
            Enter your marks, snap a screenshot, or upload your transcript — AcademicSync tracks your GPA and CGPA in real time, with zero manual math.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/signup" className="flex items-center justify-center px-8 py-4 rounded-xl font-bold text-base bg-[#E8664A] text-white hover:bg-[#E8664A]/95 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-[#E8664A]/20">
              Get started free
            </Link>
            <a href="#how-it-works" className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base border border-[#0F6E56] text-[#0F6E56] hover:bg-[#0F6E56]/5 transition-colors">
              <Play size={16} fill="currentColor" />
              See how it works
            </a>
          </div>

          {/* Trust Row */}
          <div className="pt-8 space-y-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#1A1A1A]/50">Used by students at 40+ universities</p>
            <div className="flex flex-wrap gap-6 items-center opacity-40 grayscale contrast-200">
              {['Stanford', 'MIT', 'Berkeley', 'Oxford'].map(univ => (
                <div key={univ} className="font-serif font-extrabold text-sm sm:text-base tracking-widest text-[#1A1A1A]">
                  🛡️ {univ.toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hero mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-xl bg-white rounded-2xl p-1.5 shadow-xl border border-black/5">
            <div className="bg-[#1A1A1A] rounded-xl overflow-hidden aspect-[4/3] relative flex flex-col text-white">
              <div className="bg-[#1A1A1A] h-9 w-full border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                <div className="mx-auto bg-white/5 border border-white/10 rounded h-5 px-6 flex items-center justify-center text-[9px] text-white/40">
                  academicsync.com/dashboard
                </div>
              </div>
              <div className="flex-1 w-full bg-[#0E131F] flex flex-col p-4 space-y-4">
                {/* CGPA mockup card */}
                <div className="flex gap-4">
                  <div className="bg-[#182035] p-5 rounded-xl border border-white/5 w-1/2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">CGPA</span>
                      <p className="text-3xl font-extrabold text-[#2dd4bf] mt-1">3.72</p>
                    </div>
                    <span className="text-[9px] text-emerald-400 mt-2 font-medium">▲ Up 0.14 this semester</span>
                  </div>
                  <div className="bg-[#182035] p-5 rounded-xl border border-white/5 w-1/2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Semester GPA</span>
                      <p className="text-3xl font-extrabold text-white mt-1">3.85</p>
                    </div>
                    <span className="text-[9px] text-white/40 mt-2">Verified Transcript load</span>
                  </div>
                </div>

                {/* mini chart */}
                <div className="bg-[#182035] flex-1 rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">GPA Trend</span>
                  <div className="flex items-end justify-between h-20 px-2 pt-2">
                    {[1.8, 2.5, 3.2, 3.5, 3.85].map((val, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 w-8">
                        <div className="w-2.5 bg-[#0F6E56] rounded-t" style={{ height: `${(val / 4.0) * 100}%`, backgroundColor: idx === 4 ? '#E8664A' : '#0F6E56' }} />
                        <span className="text-[8px] text-white/40">S{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOCIAL PROOF STRIP */}
      <section className="bg-[#0F6E56] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-around items-center gap-6 text-center">
          <div>
            <div className="text-3xl font-extrabold">50,000+</div>
            <div className="text-xs uppercase tracking-wider font-semibold mt-1 text-white/80">marks tracked</div>
          </div>
          <div className="hidden md:block h-8 w-px bg-white/20" />
          <div>
            <div className="text-3xl font-extrabold">98%</div>
            <div className="text-xs uppercase tracking-wider font-semibold mt-1 text-white/80">OCR accuracy</div>
          </div>
          <div className="hidden md:block h-8 w-px bg-white/20" />
          <div>
            <div className="text-3xl font-extrabold">4.8/5</div>
            <div className="text-xs uppercase tracking-wider font-semibold mt-1 text-white/80">average rating</div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-24 bg-white border-b border-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#E8664A]">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">Three ways to track your grades</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Manual entry',
                desc: 'Type in your course, credit hours, and score — GPA updates instantly.',
                icon: Zap,
              },
              {
                title: 'Screenshot OCR',
                desc: 'Upload a screenshot of your university portal — we extract your marks automatically with AI.',
                icon: Eye,
              },
              {
                title: 'Transcript verification',
                desc: 'Upload your official transcript from Semester 2 onward to lock in a verified CGPA.',
                icon: ShieldCheck,
              }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-[#FAFAF8] border border-[#1A1A1A]/5 hover:shadow-md transition-shadow flex flex-col items-start gap-4">
                <div className="p-3 rounded-xl bg-[#0F6E56]/10 text-[#0F6E56]">
                  <f.icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#1A1A1A]/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SEMESTER GUARD EXPLAINER */}
      <section id="how-it-works" className="py-24 bg-[#FAFAF8] border-b border-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#E8664A]">Data Integrity</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">Built-in accuracy guard</h2>
            <p className="text-base text-[#1A1A1A]/70 leading-relaxed">
              Semester 1 marks stay pending until an official university transcript verifies them. This prevents incorrect GPA estimations and ensures your cumulative academic profile matches your registrar records perfectly.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#1A1A1A]/5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/55 mb-6 text-center">Transcript verification lifecycle</h4>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative">
              {/* Stepper logic */}
              {[
                { name: 'Draft', desc: 'User entry' },
                { name: 'Pending', desc: 'Needs doc' },
                { name: 'Verified', desc: 'OCR verified', highlight: true },
                { name: 'Locked', desc: 'Archived' },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center w-full relative z-10">
                  <div className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${step.highlight ? 'bg-[#0F6E56] text-white border-[#0F6E56]' : 'bg-[#FAFAF8] text-[#1A1A1A]/60 border-[#1A1A1A]/10'}`}>
                    {step.name}
                  </div>
                  <span className="text-[10px] text-[#1A1A1A]/50 mt-1.5">{step.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. DASHBOARD PREVIEW SECTION */}
      <section className="py-24 bg-white border-b border-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">See your progress at a glance</h2>
            <p className="text-base text-[#1A1A1A]/70">
              Track semester GPA and cumulative CGPA side by side, with projections for what you need to hit your target.
            </p>
          </div>

          <div className="bg-[#FAFAF8] rounded-2xl border border-[#1A1A1A]/5 p-4 sm:p-8 max-w-4xl mx-auto shadow-sm">
            {/* Inner Dashboard Mockup showing Analysis page layout */}
            <div className="bg-[#1A1A1A] rounded-xl overflow-hidden shadow-lg border border-white/5 text-white">
              <div className="bg-[#1E1E1E] h-10 w-full flex items-center px-4 gap-2 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="text-xs text-white/50 text-[10px]">AcademicSync GPA Analysis Tool</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                {/* Left side chart */}
                <div className="md:col-span-8 space-y-4">
                  <span className="text-xs uppercase tracking-wider text-white/40 font-bold">Cumulative Target Analysis</span>
                  <div className="h-44 bg-[#141414] rounded-lg border border-white/5 flex items-center justify-center p-4">
                    {/* Simulated chart graph */}
                    <div className="w-full h-full flex flex-col justify-between">
                      <div className="flex justify-between text-[9px] text-white/30 border-b border-white/5 pb-1">
                        <span>Target: 3.50</span>
                        <span>Current: 3.28</span>
                      </div>
                      <div className="flex-1 flex items-end gap-1.5 pt-2">
                        {[1.8, 2.5, 3.2, 3.28, 3.6].map((bar, i) => (
                          <div key={i} className="flex-1 bg-[#0F6E56]/40 rounded-t h-full relative" style={{ height: `${(bar / 4.0) * 100}%` }}>
                            {i === 4 && <div className="absolute inset-0 bg-[#E8664A] rounded-t opacity-90 animate-pulse" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side projection widget */}
                <div className="md:col-span-4 bg-[#1D1E22] p-5 rounded-lg border border-white/5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Goal Projector</span>
                    <h5 className="text-sm font-bold">Target CGPA: 3.50</h5>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Based on remaining load, you will need to achieve a GPA of <strong className="text-white">3.60</strong> in the next semester.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/5 text-[10px] text-white/40">
                    Remaining Semesters: 4
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIAL SECTION */}
      <section className="py-24 bg-white border-b border-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <h2 className="text-3xl font-bold tracking-tight text-center text-[#1A1A1A]">Loved by students</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Khadija Rehman',
                univ: 'FAST-NUCES',
                quote: 'I used to keep three separate versions of my GPA spreadsheet. Now AcademicSync handles the projection logic automatically. Highly recommend!',
              },
              {
                name: 'Zainab Fatima',
                univ: 'LUMS',
                quote: 'The screenshot upload parsed my entire semester scale in 3 seconds. The fact that it verified against my transcripts later makes it actually reliable.',
              },
              {
                name: 'Bilal Siddiqui',
                univ: 'NUST',
                quote: 'Simple interface, no annoying ads, and the Goal Projection widget is exactly what I needed to track my Dean List qualifications.',
              }
            ].map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#1A1A1A]/5 flex flex-col justify-between gap-4">
                <p className="text-sm italic text-[#1A1A1A]/80 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0F6E56]/10 text-[#0F6E56] font-bold text-xs flex items-center justify-center">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1A1A]">{t.name}</h4>
                    <span className="text-[10px] text-[#1A1A1A]/60">{t.univ}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA SECTION */}
      <section className="bg-[#0F6E56] text-white py-24 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Stop calculating your GPA by hand</h2>
          <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto">
            Join thousands of students who track their academic progress automatically.
          </p>
          <div className="pt-4">
            <Link href="/signup" className="inline-flex items-center justify-center px-10 py-4.5 rounded-xl font-bold text-base bg-[#E8664A] text-white hover:bg-[#E8664A]/95 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#E8664A]/20">
              Sign up free
            </Link>
          </div>
          <p className="text-xs text-white/50">No credit card required</p>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#1A1A1A] text-white/60 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-white/5">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 rounded bg-[#0F6E56] flex items-center justify-center text-white">
                <GraduationCap size={14} />
              </div>
              <span className="font-bold text-sm">AcademicSync</span>
            </div>
            <p className="text-xs leading-relaxed text-white/40">
              The modern academic performance and cumulative progress tracking portal for university students.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
              <li><Link href="/try" className="hover:text-white transition-colors">Try Calculator</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-white">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} AcademicSync. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">GitHub</a>
            <a href="#" className="hover:text-white">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
