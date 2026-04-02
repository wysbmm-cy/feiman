export type MessageRole = 'system' | 'user' | 'assistant'

export interface AIMessage {
  id: string
  role: MessageRole
  content: string
  reasoning?: string
  timestamp: string
  isStreaming?: boolean
  error?: string
}

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

export const PROVIDER_PRESETS: Omit<AIProviderConfig, 'id' | 'apiKey' | 'isDefault'>[] = [
  {
    name: 'OpenAI GPT-4o',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7,
    streamingEnabled: true,
    embeddingModel: 'text-embedding-3-small'
  },
  {
    name: 'DeepSeek V3',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7,
    streamingEnabled: true,
    embeddingModel: 'text-embedding-3-small' // DeepSeek 兼容 OpenAI embedding API
  },
  {
    name: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    maxTokens: 4096,
    temperature: 0.7,
    streamingEnabled: true,
    embeddingModel: 'text-embedding-v3' // 通义千问的 embedding 模型
  },
  {
    name: 'Kimi (月之暗面)',
    baseURL: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    maxTokens: 4096,
    temperature: 0.7,
    streamingEnabled: true,
    embeddingModel: 'text-embedding-3-small' // Kimi 兼容 OpenAI embedding API
  },
  {
    name: '智谱 GLM-4',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    maxTokens: 4096,
    temperature: 0.7,
    streamingEnabled: true,
    embeddingModel: 'embedding-3' // 智谱的 embedding 模型
  },
  {
    name: '自定义',
    baseURL: 'http://localhost:11434/v1',
    model: 'llama3',
    maxTokens: 4096,
    temperature: 0.7,
    streamingEnabled: true,
    embeddingModel: 'nomic-embed-text' // Ollama 默认 embedding 模型
  }
]
