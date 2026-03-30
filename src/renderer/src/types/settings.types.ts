import type { AIProviderConfig } from './ai.types'

export type ThemeMode = 'light' | 'dark' | 'system'
export type EditorViewMode = 'split' | 'edit' | 'preview'
export type FontSize = 'sm' | 'md' | 'lg'

export type ColorScheme =
  | 'sakura' | 'mint' | 'sky' | 'forest'
  | 'mauve' | 'golden' | 'cheery' | 'prussian'
  | 'vampire' | 'abyss' | 'radiation'

export interface AppearanceSettings {
  theme: ThemeMode
  colorScheme: ColorScheme
  editorViewMode: EditorViewMode
  fontSize: FontSize
  showStatusBar: boolean
  showWordCount: boolean
  cornellCuesWidth: number
}

export interface AppSettings {
  appearance: AppearanceSettings
  aiProviders: AIProviderConfig[]
  activeProviderId: string
  expertProviderId?: string
  useDualModel?: boolean
  studentProviderId?: string
  notebooksRootPath: string
  autoSaveInterval: number
  version: string
}
