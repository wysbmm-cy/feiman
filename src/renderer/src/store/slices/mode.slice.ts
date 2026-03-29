import type { StateCreator } from 'zustand'

export type AppMode = 'general' | 'cpp'

export interface ModeSlice {
  // 当前模式
  mode: AppMode
  
  // 模式切换
  setMode: (mode: AppMode) => void
  toggleMode: () => void
  
  // 模式信息
  isCppMode: () => boolean
  getModeLabel: () => string
  getModeDescription: () => string
  
  // C++ 模式专属配置
  cppConfig: {
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    focusAreas: CppFocusArea[]
    studentPersonality: 'curious' | 'skeptical' | 'struggling'
  }
  updateCppConfig: (config: Partial<ModeSlice['cppConfig']>) => void
}

export type CppFocusArea = 
  | 'memory_management'
  | 'pointers_references'
  | 'oop'
  | 'templates'
  | 'stl'
  | 'modern_cpp'
  | 'performance'
  | 'concurrency'

export const createModeSlice: StateCreator<ModeSlice, [], [], ModeSlice> = (set, get) => ({
  mode: 'general',
  
  setMode: (mode) => set({ mode }),
  
  toggleMode: () => set((state) => ({ 
    mode: state.mode === 'general' ? 'cpp' : 'general' 
  })),
  
  isCppMode: () => {
    const { mode } = get()
    return mode === 'cpp'
  },
  
  getModeLabel: () => {
    const labels: Record<AppMode, string> = {
      general: '通用模式',
      cpp: 'C++ 模式'
    }
    return labels[get().mode]
  },
  
  getModeDescription: () => {
    const descriptions: Record<AppMode, string> = {
      general: '适用于各类知识的学习',
      cpp: '专精 C++ 深度概念理解，特化 AI 导师'
    }
    return descriptions[get().mode]
  },
  
  cppConfig: {
    difficulty: 'intermediate',
    focusAreas: ['memory_management', 'pointers_references', 'modern_cpp'],
    studentPersonality: 'curious'
  },
  
  updateCppConfig: (config) => set((state) => ({
    cppConfig: { ...state.cppConfig, ...config }
  }))
})
