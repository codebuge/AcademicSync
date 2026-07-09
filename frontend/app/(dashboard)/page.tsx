import { redirect } from 'next/navigation'

// ponytail: route moved to /dashboard — redirect avoids 404 for any bookmarked /
export default function OldDashboardRoot() {
  redirect('/dashboard')
}
