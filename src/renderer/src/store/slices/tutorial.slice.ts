import type { StateCreator } from 'zustand'

export interface TutorialStep {
  id: string
  targetSelector: string // CSS selector for the element to highlight
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  icon?: string
  action?: {
    type: 'click' | 'hover' | 'input'
    selector?: string
    hint?: string
  }
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    targetSelector: '',
    title: '欢迎来到 Anything Feynman！',
    description: '这是一款基于费曼学习法的 AI 学习软件，通过"以教促学"帮助你深度理解知识。接下来，我将带你快速了解核心功能。',
    position: 'center',
    icon: '🎓'
  },
  {
    id: 'sidebar',
    targetSelector: '[data-tutorial="sidebar"]',
    title: '笔记本管理',
    description: '在这里管理你的笔记本和笔记。点击「新建笔记本」创建第一个笔记本，然后在其中创建笔记开始学习。',
    position: 'right',
    icon: '📚'
  },
  {
    id: 'new-notebook',
    targetSelector: '[data-tutorial="new-notebook"]',
    title: '创建笔记本',
    description: '点击这里创建新的笔记本，用于组织不同主题的学习内容。',
    position: 'top',
    icon: '📁',
    action: { type: 'hover', hint: '试试点击这个按钮' }
  },
  {
    id: 'mode-toggle',
    targetSelector: '[data-tutorial="mode-toggle"]',
    title: '学习模式切换',
    description: '支持通用模式和编程学习模式。编程模式针对 C++、Python、Java、JavaScript 提供特化教学。',
    position: 'bottom',
    icon: '⚡'
  },
  {
    id: 'student-panel',
    targetSelector: '[data-tutorial="student-panel"]',
    title: 'AI 学生面板',
    description: 'AI 学生"小方"会扮演学习者，向你提问，帮助你发现自己理解不够深入的地方。快捷键：Ctrl+\\',
    position: 'bottom',
    icon: '💬'
  },
  {
    id: 'knowledge-base',
    targetSelector: '[data-tutorial="knowledge-base"]',
    title: '知识库',
    description: '上传 PDF、TXT、Markdown 文件到知识库，AI 会自动学习其中的内容，并在对话时引用相关知识。\n\n⚠️ 注意：知识库需要 Embedding API 支持，请确保你的 AI 提供商支持 Embedding 功能。',
    position: 'right',
    icon: '📖'
  },
  {
    id: 'help-button',
    targetSelector: '[data-tutorial="help-button"]',
    title: '使用帮助',
    description: '点击这里可以随时查看详细的使用指导和 AI 模型配置教程。',
    position: 'bottom',
    icon: '❓',
    action: { type: 'click', hint: '点击查看帮助文档' }
  },
  {
    id: 'settings',
    targetSelector: '[data-tutorial="settings"]',
    title: '系统设置',
    description: '最重要！点击这里配置 AI 模型。首次使用需要添加 API Key 才能与 AI 对话。\n\n💡 提示：如果你的 AI 提供商不支持 Embedding（如某些国产大模型），请在"角色分配"中配置一个支持 Embedding 的提供商用于知识库功能。',
    position: 'bottom',
    icon: '⚙️'
  },
  {
    id: 'complete',
    targetSelector: '',
    title: '教程完成！',
    description: '你已了解核心功能。现在去设置中配置 AI 模型，然后创建你的第一个笔记开始学习吧！\n\n📌 配置要点：\n1. 添加你的 AI 提供商和 API Key\n2. 如果使用知识库，确保配置了支持 Embedding 的提供商\n3. 随时点击标题栏的 ❓ 按钮重新查看帮助',
    position: 'center',
    icon: '🎉'
  }
]

export interface TutorialSlice {
  // Tutorial state
  tutorialCompleted: boolean
  tutorialActive: boolean
  tutorialStep: number
  tutorialSkipped: boolean
  
  // Actions
  startTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  skipTutorial: () => void
  completeTutorial: () => void
  resetTutorial: () => void
  goToStep: (step: number) => void
  
  // Getters
  getCurrentStep: () => TutorialStep | null
  isLastStep: () => boolean
  isFirstStep: () => boolean
  getProgress: () => { current: number; total: number; percent: number }
}

const STORAGE_KEY = 'feiman_tutorial_state'

interface StoredTutorialState {
  completed: boolean
  skipped: boolean
  completedAt?: string
}

function loadStoredState(): StoredTutorialState {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { completed: false, skipped: false }
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load tutorial state:', e)
  }
  return { completed: false, skipped: false }
}

function saveStoredState(state: StoredTutorialState): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  } catch (e) {
    console.error('Failed to save tutorial state:', e)
  }
}

const storedState = loadStoredState()

export const createTutorialSlice: StateCreator<TutorialSlice, [], [], TutorialSlice> = (set, get) => ({
  tutorialCompleted: storedState.completed,
  tutorialActive: false,
  tutorialStep: 0,
  tutorialSkipped: storedState.skipped,
  
  startTutorial: () => set({ 
    tutorialActive: true, 
    tutorialStep: 0 
  }),
  
  nextStep: () => {
    const { tutorialStep } = get()
    const nextIndex = tutorialStep + 1
    
    if (nextIndex >= TUTORIAL_STEPS.length) {
      // Tutorial complete
      saveStoredState({ completed: true, completedAt: new Date().toISOString() })
      set({ 
        tutorialActive: false, 
        tutorialCompleted: true,
        tutorialStep: 0 
      })
    } else {
      set({ tutorialStep: nextIndex })
    }
  },
  
  prevStep: () => {
    const { tutorialStep } = get()
    if (tutorialStep > 0) {
      set({ tutorialStep: tutorialStep - 1 })
    }
  },
  
  skipTutorial: () => {
    saveStoredState({ completed: true, skipped: true, completedAt: new Date().toISOString() })
    set({ 
      tutorialActive: false, 
      tutorialCompleted: true,
      tutorialSkipped: true,
      tutorialStep: 0 
    })
  },
  
  completeTutorial: () => {
    saveStoredState({ completed: true, completedAt: new Date().toISOString() })
    set({ 
      tutorialActive: false, 
      tutorialCompleted: true,
      tutorialStep: 0 
    })
  },
  
  resetTutorial: () => {
    saveStoredState({ completed: false, skipped: false })
    set({ 
      tutorialActive: false, 
      tutorialCompleted: false,
      tutorialSkipped: false,
      tutorialStep: 0 
    })
  },
  
  goToStep: (step) => {
    if (step >= 0 && step < TUTORIAL_STEPS.length) {
      set({ tutorialStep: step, tutorialActive: true })
    }
  },
  
  getCurrentStep: () => {
    const { tutorialStep, tutorialActive } = get()
    if (!tutorialActive) return null
    return TUTORIAL_STEPS[tutorialStep] || null
  },
  
  isLastStep: () => {
    const { tutorialStep } = get()
    return tutorialStep >= TUTORIAL_STEPS.length - 1
  },
  
  isFirstStep: () => {
    const { tutorialStep } = get()
    return tutorialStep === 0
  },
  
  getProgress: () => {
    const { tutorialStep } = get()
    const total = TUTORIAL_STEPS.length
    return {
      current: tutorialStep + 1,
      total,
      percent: Math.round(((tutorialStep + 1) / total) * 100)
    }
  }
})
