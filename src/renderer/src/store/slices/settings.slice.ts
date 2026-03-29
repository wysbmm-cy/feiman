import type { StateCreator } from 'zustand'
import type { AppSettings, AIProviderConfig, AppearanceSettings } from '../../types'

const DEFAULT_PROVIDER_ID = '302ai-gemini-3-1-flash-lite-preview'

const DEFAULT_PROVIDER: AIProviderConfig = {
  id: DEFAULT_PROVIDER_ID,
  name: '302AI Gemini 3.1 Flash Lite',
  baseURL: 'https://api.302ai.cn/v1',
  apiKey: 'sk-piyVj5Yv6yrOtnUlmtdtmi0Vq92Y0sCTD8tT2oKH2t5BWrvR',
  model: 'gemini-3.1-flash-lite-preview',
  maxTokens: 4096,
  temperature: 0.7,
  streamingEnabled: true,
  isDefault: true
}

const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: 'dark',
    colorScheme: 'vampire',
    editorViewMode: 'split',
    fontSize: 'md',
    showStatusBar: true,
    showWordCount: true,
    cornellCuesWidth: 30
  },
  aiProviders: [DEFAULT_PROVIDER],
  activeProviderId: DEFAULT_PROVIDER_ID,
  expertProviderId: DEFAULT_PROVIDER_ID,
  useDualModel: false,
  studentProviderId: DEFAULT_PROVIDER_ID,
  notebooksRootPath: '',
  autoSaveInterval: 2000,
  version: '0.1.0'
}

export interface SettingsSlice {
  settings: AppSettings
  settingsLoaded: boolean

  setSettings: (s: AppSettings) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  updateAppearance: (partial: Partial<AppearanceSettings>) => void
  addProvider: (provider: AIProviderConfig) => void
  updateProvider: (provider: AIProviderConfig) => void
  removeProvider: (id: string) => void
  setActiveProvider: (id: string) => void
  setExpertProviderId: (id: string) => void
  setUseDualModel: (use: boolean) => void
  setStudentProviderId: (id: string) => void
  setSettingsLoaded: (loaded: boolean) => void
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set) => ({
  settings: DEFAULT_SETTINGS,
  settingsLoaded: false,

  setSettings: (settings) => set({ settings, settingsLoaded: true }),

  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial }
    })),

  updateAppearance: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        appearance: { ...state.settings.appearance, ...partial }
      }
    })),

  addProvider: (provider) =>
    set((state) => ({
      settings: {
        ...state.settings,
        aiProviders: [...state.settings.aiProviders, provider],
        activeProviderId: state.settings.activeProviderId || provider.id
      }
    })),

  updateProvider: (provider) =>
    set((state) => ({
      settings: {
        ...state.settings,
        aiProviders: state.settings.aiProviders.map((p) =>
          p.id === provider.id ? provider : p
        )
      }
    })),

  removeProvider: (id) =>
    set((state) => ({
      settings: {
        ...state.settings,
        aiProviders: state.settings.aiProviders.filter((p) => p.id !== id),
        activeProviderId: state.settings.activeProviderId === id ? '' : state.settings.activeProviderId,
        expertProviderId: state.settings.expertProviderId === id ? '' : state.settings.expertProviderId,
        studentProviderId: state.settings.studentProviderId === id ? '' : state.settings.studentProviderId
      }
    })),

  setActiveProvider: (id) =>
    set((state) => ({
      settings: {
        ...state.settings,
        activeProviderId: id,
        aiProviders: state.settings.aiProviders.map((p) => ({
          ...p,
          isDefault: p.id === id
        }))
      }
    })),

  setUseDualModel: (useDualModel) =>
    set((state) => ({
      settings: { ...state.settings, useDualModel }
    })),

  setExpertProviderId: (id) =>
    set((state) => ({
      settings: { ...state.settings, expertProviderId: id }
    })),

  setStudentProviderId: (id) =>
    set((state) => ({
      settings: { ...state.settings, studentProviderId: id }
    })),

  setSettingsLoaded: (settingsLoaded) => set({ settingsLoaded })
})
