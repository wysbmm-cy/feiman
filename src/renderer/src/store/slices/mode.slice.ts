import type { StateCreator } from 'zustand'
import type { ProgrammingLanguage } from '../../types/code-teaching.types'
import { LANGUAGE_CONFIGS } from '../../types/code-teaching.types'

export type AppMode = 'general' | 'code'

export interface ModeSlice {
  // 当前模式
  mode: AppMode
  
  // 编程语言选择
  currentLanguage: ProgrammingLanguage | null
  
  // 模式切换
  setMode: (mode: AppMode) => void
  toggleMode: () => void
  setCurrentLanguage: (language: ProgrammingLanguage | null) => void
  
  // 模式信息
  isCodeMode: () => boolean
  getModeLabel: () => string
  getModeDescription: () => string
  getCurrentLanguageConfig: () => typeof LANGUAGE_CONFIGS[ProgrammingLanguage] | null
  
  // 编程模式专属配置
  codeConfig: {
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    focusAreas: string[]
    studentPersonality: 'curious' | 'skeptical' | 'struggling'
  }
  updateCodeConfig: (config: Partial<ModeSlice['codeConfig']>) => void
  
  // 兼容旧版 C++ API（向后兼容）
  cppConfig: {
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    focusAreas: CppFocusArea[]
    studentPersonality: 'curious' | 'skeptical' | 'struggling'
  }
  updateCppConfig: (config: Partial<ModeSlice['cppConfig']>) => void
  isCppMode: () => boolean
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

// 语言对应默认关注领域
const DEFAULT_FOCUS_AREAS: Record<ProgrammingLanguage, string[]> = {
  cpp: ['memory_management', 'pointers_references', 'modern_cpp'],
  python: ['decorators', 'generators', 'async_programming'],
  java: ['oop', 'concurrency', 'design_patterns'],
  javascript: ['closures', 'prototypes', 'async_programming']
}

export const createModeSlice: StateCreator<ModeSlice, [], [], ModeSlice> = (set, get) => ({
  mode: 'general',
  currentLanguage: null,
  
  setMode: (mode) => set({ mode }),
  
  toggleMode: () => set((state) => ({ 
    mode: state.mode === 'general' ? 'code' : 'general',
    // 首次切换到code模式时，默认选择C++
    currentLanguage: state.mode === 'general' ? (state.currentLanguage || 'cpp') : null
  })),
  
  setCurrentLanguage: (language) => set({ 
    currentLanguage: language,
    // 同时更新关注领域
    codeConfig: language ? {
      ...get().codeConfig,
      focusAreas: DEFAULT_FOCUS_AREAS[language] || []
    } : get().codeConfig
  }),
  
  isCodeMode: () => {
    const { mode } = get()
    return mode === 'code'
  },
  
  getModeLabel: () => {
    const { mode, currentLanguage } = get()
    if (mode === 'general') return '通用模式'
    
    if (currentLanguage && LANGUAGE_CONFIGS[currentLanguage]) {
      return LANGUAGE_CONFIGS[currentLanguage].displayName + ' 模式'
    }
    return '编程模式'
  },
  
  getModeDescription: () => {
    const { mode, currentLanguage } = get()
    if (mode === 'general') return '适用于各类知识的学习'
    
    if (currentLanguage && LANGUAGE_CONFIGS[currentLanguage]) {
      return LANGUAGE_CONFIGS[currentLanguage].description
    }
    return '专精编程深度概念理解，特化 AI 导师'
  },
  
  getCurrentLanguageConfig: () => {
    const { currentLanguage } = get()
    if (currentLanguage && LANGUAGE_CONFIGS[currentLanguage]) {
      return LANGUAGE_CONFIGS[currentLanguage]
    }
    return null
  },
  
  codeConfig: {
    difficulty: 'intermediate',
    focusAreas: ['basics'],
    studentPersonality: 'curious'
  },
  
  updateCodeConfig: (config) => set((state) => ({
    codeConfig: { ...state.codeConfig, ...config }
  })),
  
  // 兼容旧版 C++ API - 存储为独立状态
  cppConfig: {
    difficulty: 'intermediate',
    focusAreas: [],
    studentPersonality: 'curious'
  },
  
  updateCppConfig: (config) => set((state) => ({
    cppConfig: { ...state.cppConfig, ...config },
    codeConfig: { ...state.codeConfig, ...config }
  })),
  
  isCppMode: () => {
    const { mode, currentLanguage } = get()
    return mode === 'code' && currentLanguage === 'cpp'
  }
})
