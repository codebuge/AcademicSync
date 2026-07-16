'use client'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-12 relative overflow-hidden bg-[#FAFAF8] text-[#1a1c1b]">
      {/* Subtle teal accent background (Stitch design) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 10% 10%, rgba(0, 84, 64, 0.03) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(0, 84, 64, 0.02) 0%, transparent 40%)'
        }}
      />
      <div 
        className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] pointer-events-none rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(8, 107, 83, 0.05) 0%, rgba(250, 250, 248, 0) 70%)'
        }}
      />

      <main className="w-full max-w-[440px] flex flex-col items-center z-10 animate-fade-in">
        {/* Logo Branding */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#005440] rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9L12 15L21 10.5V17.5H23V9L12 3Z"/>
              <path d="M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#005440] tracking-tight">AcademicSync</h1>
        </div>

        {/* Card wrapper */}
        <div className="w-full bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-[#bec9c3]/30">
          {children}
        </div>
      </main>
    </div>
  )
}
