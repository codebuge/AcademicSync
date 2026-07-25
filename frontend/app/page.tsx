'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck, Zap, Laptop, FileDown, Eye, Check, GraduationCap, Menu, X } from 'lucide-react'
import { Navbar } from '@/components/Navbar'

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans bg-[#131a26] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* 1. NEOMORPHIC NAVIGATION BAR */}
      <Navbar />

      {/* 2. HERO SECTION */}
      <section className="relative pt-28 pb-20 px-4 max-w-7xl mx-auto lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 neo-badge px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles size={14} />
            <span>AI-Powered Automatic GPA & Transcript Verifier</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Your GPA, calculated <span className="gradient-text">instantly.</span><br />
            Your transcript, <span className="text-emerald-400">verified automatically.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
            Enter your marks, upload a grading scale screenshot, or sync your official transcript — AcademicSync tracks your GPA and CGPA with zero manual math.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/signup" className="flex items-center justify-center gap-2 px-8 py-4 neo-button-primary text-base">
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/try" className="flex items-center justify-center gap-2 px-6 py-4 neo-button text-base">
              <Play size={16} className="text-emerald-400" />
              <span>Try Public Calculator</span>
            </Link>
          </div>

          {/* Trust Row */}
          <div className="pt-8 space-y-3">
            <p className="text-xs uppercase tracking-widest font-semibold text-slate-400">Trusted by students at 40+ universities</p>
            <div className="flex flex-wrap gap-4 items-center">
              {['Stanford', 'MIT', 'Berkeley', 'Oxford'].map(univ => (
                <div key={univ} className="px-3.5 py-1.5 neo-badge text-xs font-bold text-slate-300">
                  🛡️ {univ}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Neomorphic Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-xl neo-card p-4">
            <div className="neo-card-sm overflow-hidden p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-xs font-mono text-slate-400">academicsync.com/portal</span>
              </div>

              {/* CGPA mockup card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="neo-card-sm p-4">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CGPA</span>
                  <p className="text-3xl font-extrabold text-emerald-400 mt-1">3.82</p>
                  <span className="text-[10px] text-emerald-400 mt-2 block font-medium">▲ Up 0.14 this term</span>
                </div>
                <div className="neo-card-sm p-4">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Semester GPA</span>
                  <p className="text-3xl font-extrabold text-white mt-1">3.95</p>
                  <span className="text-[10px] text-purple-400 mt-2 block font-medium">Verified Transcript</span>
                </div>
              </div>

              {/* Mini Chart Mockup */}
              <div className="neo-card-sm p-4 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Semester Progression</span>
                <div className="flex items-end justify-between h-24 px-2 pt-2">
                  {[2.8, 3.2, 3.5, 3.7, 3.95].map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 w-10">
                      <div className="w-4 bg-emerald-500/80 neo-badge rounded-t" style={{ height: `${(val / 4.0) * 100}%` }} />
                      <span className="text-[9px] text-slate-400">Sem {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NEOMORPHIC STATS STRIP */}
      <section className="py-12 px-4 max-w-7xl mx-auto lg:px-8">
        <div className="neo-card p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-4xl font-extrabold text-emerald-400">50,000+</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">Marks Tracked</div>
          </div>
          <div className="space-y-1 border-y md:border-y-0 md:border-x border-slate-800 py-4 md:py-0">
            <div className="text-4xl font-extrabold text-purple-400">99.2%</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">OCR Parsing Accuracy</div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-extrabold text-cyan-400">4.9 / 5</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">Student Satisfaction</div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Platform Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">3 Ways to Track Academic Progress</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Instant Manual Entry',
              desc: 'Enter course name, credit hours, and marks to calculate GPA instantly with custom grading scales.',
              icon: Zap,
              color: 'text-emerald-400',
            },
            {
              title: 'AI Screenshot OCR',
              desc: 'Upload a photo of your university portal grading table to extract scale boundaries automatically.',
              icon: Eye,
              color: 'text-purple-400',
            },
            {
              title: 'Transcript Verification',
              desc: 'Upload official transcript PDFs from Semester 2 onward to automatically lock in verified marks.',
              icon: ShieldCheck,
              color: 'text-cyan-400',
            }
          ].map((f, i) => (
            <div key={i} className="neo-card p-8 neo-card-hover flex flex-col items-start gap-4">
              <div className={`p-4 neo-card-sm ${f.color}`}>
                <f.icon size={26} />
              </div>
              <h3 className="text-xl font-bold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. METHODOLOGY / GUARD SECTION */}
      <section id="methodology" className="py-20 px-4 max-w-7xl mx-auto lg:px-8">
        <div className="neo-card p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Academic Integrity</span>
            <h2 className="text-3xl font-bold text-white">Semester Guard Protection</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Semester 1 marks remain marked as pending until an official transcript verified upload occurs. This ensures your CGPA calculation strictly mirrors official university records.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href="/signup" className="neo-button-primary px-6 py-3 text-sm">
                Get Started
              </Link>
            </div>
          </div>

          <div className="neo-card-sm p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status Lifecycle</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Draft', desc: 'User entered', badge: 'bg-slate-800 text-slate-300' },
                { name: 'Pending', desc: 'Needs transcript', badge: 'bg-amber-950/40 text-amber-400' },
                { name: 'Verified', desc: 'OCR verified', badge: 'bg-emerald-950/40 text-emerald-400' },
                { name: 'Locked', desc: 'Official record', badge: 'bg-purple-950/40 text-purple-400' },
              ].map((step, idx) => (
                <div key={idx} className="neo-card-sm p-4 text-center space-y-1">
                  <span className={`inline-block px-3 py-1 neo-badge text-xs font-bold ${step.badge}`}>{step.name}</span>
                  <p className="text-[10px] text-slate-400">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="py-20 px-4 max-w-7xl mx-auto lg:px-8 text-center">
        <div className="neo-card p-12 space-y-6 relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to automate your GPA tracking?</h2>
          <p className="text-base text-slate-300 max-w-xl mx-auto">
            Join thousands of students who calculate their grades seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link href="/signup" className="neo-button-primary px-8 py-4 text-base">
              Create Free Account
            </Link>
            <Link href="/try" className="neo-button px-8 py-4 text-base">
              Try Public Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 border-t border-slate-800 text-slate-400 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} AcademicSync. All rights reserved.</p>
          <div className="flex gap-6 font-medium">
            <Link href="/privacy" className="hover:text-emerald-400">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-400">Terms</Link>
            <Link href="/try" className="hover:text-emerald-400">Try Calculator</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
