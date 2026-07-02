import { create } from 'zustand'
import type { User, Mark, GpaHistory, Transcript, CgpaResponse } from '@/types'

interface AppState {
  // State
  user: User | null
  marks: Mark[]
  gpaHistory: GpaHistory[]
  transcripts: Transcript[]
  cgpaData: CgpaResponse | null
  isLoading: boolean
  semesterGuardVisible: boolean

  // Actions
  setUser: (user: User | null) => void
  setMarks: (marks: Mark[]) => void
  setGpaHistory: (history: GpaHistory[]) => void
  setTranscripts: (transcripts: Transcript[]) => void
  setCgpaData: (data: CgpaResponse | null) => void
  setLoading: (loading: boolean) => void
  showSemesterGuard: () => void
  hideSemesterGuard: () => void
  clearStore: () => void
}

const initialState = {
  user: null,
  marks: [],
  gpaHistory: [],
  transcripts: [],
  cgpaData: null,
  isLoading: false,
  semesterGuardVisible: false,
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setMarks: (marks) => set({ marks }),
  setGpaHistory: (history) => set({ gpaHistory: history }),
  setTranscripts: (transcripts) => set({ transcripts }),
  setCgpaData: (data) => set({ cgpaData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  showSemesterGuard: () => set({ semesterGuardVisible: true }),
  hideSemesterGuard: () => set({ semesterGuardVisible: false }),
  clearStore: () => set(initialState),
}))
