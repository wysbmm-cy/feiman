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
  embeddingModel?: string // 可选的 embedding 模型配置
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  colorScheme: string
  editorViewMode: 'split' | 'edit' | 'preview'
  fontSize: 'sm' | 'md' | 'lg'
  buttonSize: 'sm' | 'md' | 'lg'
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
  studentProviderId?: string
  embeddingProviderId?: string // 专用于知识库 Embedding 的提供商
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
  isDefault: true,
  embeddingModel: 'text-embedding-3-small'
}

const defaultSettings: AppSettings = {
  appearance: {
    theme: 'dark',
    colorScheme: 'vampire',
    editorViewMode: 'split',
    fontSize: 'md',
    buttonSize: 'md',
    fontFamily: 'system-ui',
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
  version: '1.1.2'
}

const CURRENT_VERSION = '1.1.2'

const store = new Store<AppSettings>({
  name: 'feiman-settings',
  defaults: defaultSettings
})

function migrateSettings(input: AppSettings): AppSettings {
  // Check if version matches, if not merge with defaults to ensure all fields exist
  if (input.version !== CURRENT_VERSION) {
    // Merge with defaults to ensure all new fields have values
    // But preserve user's important settings like API keys and preferences
    const appearance = input.appearance || {}
    return {
      ...defaultSettings,
      ...input,
      appearance: {
        ...defaultSettings.appearance,
        ...appearance,
        // Ensure new fields have defaults
        buttonSize: appearance.buttonSize || defaultSettings.appearance.buttonSize,
        fontFamily: appearance.fontFamily || defaultSettings.appearance.fontFamily,
        colorScheme: appearance.colorScheme || defaultSettings.appearance.colorScheme,
      },
      version: CURRENT_VERSION
    }
  }
  return input
}

function normalizeSettings(input: AppSettings): AppSettings {
  // First migrate if needed
  const migrated = migrateSettings(input)
  
  const providers = Array.isArray(migrated.aiProviders) ? [...migrated.aiProviders] : []
  const hasDefaultProvider = providers.some((provider) => provider.id === DEFAULT_PROVIDER_ID)

  if (!hasDefaultProvider) {
    providers.unshift(DEFAULT_PROVIDER)
  }

  const activeProviderId = migrated.activeProviderId || DEFAULT_PROVIDER_ID
  const expertProviderId = migrated.expertProviderId || DEFAULT_PROVIDER_ID
  const studentProviderId = migrated.studentProviderId || DEFAULT_PROVIDER_ID

  const normalizedProviders = providers.map((provider) => ({
    ...provider,
    isDefault: provider.id === activeProviderId
  }))

  return {
    ...migrated,
    aiProviders: normalizedProviders,
    activeProviderId,
    expertProviderId,
    studentProviderId,
    useDualModel: migrated.useDualModel ?? false
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
