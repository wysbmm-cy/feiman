import Store from 'electron-store'
import { join } from 'path'
import { app } from 'electron'

export interface AIProviderConfig {
  id: string
  name: string
  baseURL: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  streamingEnabled: boolean
  isDefault: boolean
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  editorViewMode: 'split' | 'edit' | 'preview'
  fontSize: 'sm' | 'md' | 'lg'
  showStatusBar: boolean
  showWordCount: boolean
  cornellCuesWidth: number
}

export interface AppSettings {
  appearance: AppearanceSettings
  aiProviders: AIProviderConfig[]
  activeProviderId: string
  expertProviderId?: string
  studentProviderId?: string
  useDualModel?: boolean
  notebooksRootPath: string
  autoSaveInterval: number
  version: string
}

const DEFAULT_PROVIDER_ID = '302ai-gemini-3-1-flash-lite-preview'

const DEFAULT_PROVIDER: AIProviderConfig = {
  id: DEFAULT_PROVIDER_ID,
  name: '302AI Gemini 3.1 Flash Lite',
  baseURL: 'https://api.302ai.cn/v1',
  apiKey: '',
  model: 'gemini-3.1-flash-lite-preview',
  maxTokens: 4096,
  temperature: 0.7,
  streamingEnabled: true,
  isDefault: true
}

const defaultSettings: AppSettings = {
  appearance: {
    theme: 'dark',
    editorViewMode: 'split',
    fontSize: 'md',
    showStatusBar: true,
    showWordCount: true,
    cornellCuesWidth: 30
  },
  aiProviders: [DEFAULT_PROVIDER],
  activeProviderId: DEFAULT_PROVIDER_ID,
  expertProviderId: DEFAULT_PROVIDER_ID,
  studentProviderId: DEFAULT_PROVIDER_ID,
  useDualModel: false,
  notebooksRootPath: join(app.getPath('documents'), 'Feiman'),
  autoSaveInterval: 2000,
  version: '0.1.0'
}

const store = new Store<AppSettings>({
  name: 'feiman-settings',
  defaults: defaultSettings
})

function normalizeSettings(input: AppSettings): AppSettings {
  const providers = Array.isArray(input.aiProviders) ? [...input.aiProviders] : []
  const hasDefaultProvider = providers.some((provider) => provider.id === DEFAULT_PROVIDER_ID)

  if (!hasDefaultProvider) {
    providers.unshift(DEFAULT_PROVIDER)
  }

  const activeProviderId = DEFAULT_PROVIDER_ID
  const expertProviderId = DEFAULT_PROVIDER_ID
  const studentProviderId = DEFAULT_PROVIDER_ID

  const normalizedProviders = providers.map((provider) => ({
    ...provider,
    isDefault: provider.id === activeProviderId
  }))

  return {
    ...input,
    aiProviders: normalizedProviders,
    activeProviderId,
    expertProviderId,
    studentProviderId,
    useDualModel: input.useDualModel ?? false
  }
}

export function getSettings(): AppSettings {
  const current = store.store
  const normalized = normalizeSettings(current)
  if (JSON.stringify(current) !== JSON.stringify(normalized)) {
    store.set(normalized as unknown as Record<string, unknown>)
  }
  return normalized
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const current = store.store
  const next = normalizeSettings({ ...current, ...partial } as AppSettings)
  store.set(next as unknown as Record<string, unknown>)
  return next
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  store.set(key as string, value)
}
