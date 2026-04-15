import type { AIProviderConfig } from './ai.types'

export type ThemeMode = 'light' | 'dark' | 'system'
export type EditorViewMode = 'split' | 'edit' | 'preview'
export type FontSize = 'sm' | 'md' | 'lg'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ColorScheme =
  | 'sakura' | 'mint' | 'sky' | 'forest'
  | 'mauve' | 'golden' | 'cheery' | 'prussian'
  | 'vampire' | 'abyss' | 'radiation'

export interface AppearanceSettings {
  theme: ThemeMode
  colorScheme: ColorScheme
  editorViewMode: EditorViewMode
  fontSize: FontSize
  buttonSize: ButtonSize
  fontFamily: string
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
  embeddingProviderId?: string // 专用于知识库 Embedding 的提供商
  notebooksRootPath: string
  autoSaveInterval: number
  version: string
}
