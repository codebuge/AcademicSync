import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get text color class based on GPA value
 */
export function getGpaColor(gpa: number): string {
  if (gpa >= 3.5) return 'text-emerald-400'
  if (gpa >= 2.5) return 'text-amber-400'
  return 'text-red-400'
}

/**
 * Get background color class based on GPA value
 */
export function getGpaBgColor(gpa: number): string {
  if (gpa >= 3.5) return 'bg-emerald-400/10 border-emerald-400/20'
  if (gpa >= 2.5) return 'bg-amber-400/10 border-amber-400/20'
  return 'bg-red-400/10 border-red-400/20'
}

/**
 * Format an ISO date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Get badge styling classes based on mark/transcript status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'verified':
    case 'parsed':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'pending_verification':
    case 'pending':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'draft':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    case 'locked':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'failed':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}
