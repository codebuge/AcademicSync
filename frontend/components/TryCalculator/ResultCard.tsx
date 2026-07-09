'use client'

interface CourseBreakdown {
  course_name: string
  letter_grade: string
  grade_points: number
}


interface ResultCardProps {
  gpa: number
  totalCreditHours: number
  breakdown: CourseBreakdown[]
}

export default function ResultCard({ gpa, totalCreditHours, breakdown }: ResultCardProps) {
  // Determine color based on GPA
  const getGpaColorClass = (val: number) => {
    if (val >= 3.5) return 'text-teal-400'
    if (val >= 2.5) return 'text-amber-400'
    return 'text-red-400'
  };

  const getGpaBgClass = (val: number) => {
    if (val >= 3.5) return 'bg-teal-500/10 border-teal-500/20'
    if (val >= 2.5) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-red-500/10 border-red-500/20'
  };

  return (
    <div className="glass rounded-2xl p-6 border-white/5 animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Calculation Result</h3>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Based on provided score metrics</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center sm:text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--muted-foreground)' }}>Total Credits</span>
            <span className="text-xl font-bold text-white">{totalCreditHours.toFixed(1)}</span>
          </div>
          <div className={`px-5 py-3 rounded-xl border text-center ${getGpaBgClass(gpa)}`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--muted-foreground)' }}>GPA</span>
            <span className={`text-3xl font-extrabold tracking-tight ${getGpaColorClass(gpa)}`}>
              {gpa.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>Course Breakdown</h4>
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th className="px-4 py-3">Course Name</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>

                {breakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3 font-medium text-white truncate max-w-[200px]" title={item.course_name}>
                      {item.course_name || `Course ${idx + 1}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-white">
                        {item.letter_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {item.grade_points.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
