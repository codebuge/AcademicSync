import axios from 'axios'
import { createClient } from './supabase'
import { useAppStore } from '@/store/useAppStore'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach Supabase JWT to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      // If we can't get the session, proceed without auth header
      console.warn('Failed to get Supabase session for API request:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: handle auth errors and semester guard
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      // On 401 Unauthorized, redirect to login
      if (status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }

      // On 403 with SEMESTER_GUARD_BLOCKED, show semester guard modal
      if (status === 403 && data?.code === 'SEMESTER_GUARD_BLOCKED') {
        const store = useAppStore.getState()
        store.showSemesterGuard()
      }
    }

    return Promise.reject(error)
  }
)

export default api
