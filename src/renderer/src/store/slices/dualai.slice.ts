import type { StateCreator } from 'zustand'
import type { VerificationSession, ExpertFeedback } from '../../types/node.types'

export interface DualAISlice {
  activeSession: VerificationSession | null
  isExpertAnalyzing: boolean
  isStudentTyping: boolean

  setActiveSession: (session: VerificationSession | null) => void
  updateSessionPhase: (phase: VerificationSession['phase']) => void
  addStudentMessage: (role: 'student' | 'user', content: string) => void
  setExpertResult: (result: ExpertFeedback) => void
  setExpertAnalyzing: (v: boolean) => void
  setStudentTyping: (v: boolean) => void
  clearSession: () => void
}

export const createDualAISlice: StateCreator<DualAISlice, [], [], DualAISlice> = (set) => ({
  activeSession: null,
  isExpertAnalyzing: false,
  isStudentTyping: false,

  setActiveSession: (session) => set({ activeSession: session }),

  updateSessionPhase: (phase) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, phase }
        : null
    })),

  addStudentMessage: (role, content) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            studentMessages: [
              ...state.activeSession.studentMessages,
              { role, content }
            ]
          }
        : null
    })),

  setExpertResult: (result) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            expertResult: result
          }
        : null
    })),

  setExpertAnalyzing: (isExpertAnalyzing) => set({ isExpertAnalyzing }),
  setStudentTyping: (isStudentTyping) => set({ isStudentTyping }),
  clearSession: () => set({ activeSession: null, isExpertAnalyzing: false, isStudentTyping: false })
})
