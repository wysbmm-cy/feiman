import OpenAI from 'openai'
import type { AIProviderConfig } from '../../types'

let currentClient: OpenAI | null = null
let currentConfig: AIProviderConfig | null = null

export function getClient(config: AIProviderConfig): OpenAI {
  if (!currentClient || currentConfig?.id !== config.id || currentConfig?.apiKey !== config.apiKey) {
    currentClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      dangerouslyAllowBrowser: true
    })
    currentConfig = config
  }
  return currentClient
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onReasoningChunk?: (chunk: string) => void
  onDone: () => void
  onError: (error: string) => void
}

function extractTextLike(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          return [
            typeof obj.text === 'string' ? obj.text : '',
            typeof obj.content === 'string' ? obj.content : '',
            typeof obj.output_text === 'string' ? obj.output_text : ''
          ].join('')
        }
        return ''
      })
      .join('')
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return [
      typeof obj.text === 'string' ? obj.text : '',
      typeof obj.content === 'string' ? obj.content : '',
      typeof obj.output_text === 'string' ? obj.output_text : ''
    ].join('')
  }
  return ''
}

export async function streamChat(
  config: AIProviderConfig,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const client = getClient(config)

  try {
    const stream = await client.chat.completions.create(
      {
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: true
      },
      { signal }
    )

    for await (const chunk of stream) {
      if (signal?.aborted) break
      const delta = (chunk.choices[0]?.delta || {}) as Record<string, unknown>
      const reasoningDelta = [
        extractTextLike(delta.reasoning_content),
        extractTextLike(delta.reasoning),
        extractTextLike(delta.thinking)
      ].join('')

      const contentDelta = [
        extractTextLike(delta.content),
        extractTextLike(delta.output_text),
        extractTextLike(delta.text)
      ].join('')

      if (reasoningDelta && callbacks.onReasoningChunk) {
        callbacks.onReasoningChunk(reasoningDelta)
      }
      if (contentDelta) callbacks.onChunk(contentDelta)
    }

    callbacks.onDone()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return
    callbacks.onError(err instanceof Error ? err.message : String(err))
  }
}

export async function chat(
  config: AIProviderConfig,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  const client = getClient(config)
  const response = await client.chat.completions.create({
    model: config.model,
    messages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    stream: false
  })
  return response.choices[0]?.message?.content || ''
}

export async function testConnection(config: AIProviderConfig): Promise<{ success: boolean; message: string }> {
  try {
    const result = await chat(config, [
      { role: 'user', content: '请回复"连接成功"四个字。' }
    ])
    return { success: true, message: result || '连接成功' }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) }
  }
}

export function parseJSON<T>(raw: string): T | null {
  // Extract JSON from code blocks if wrapped
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim()
  try {
    return JSON.parse(jsonStr) as T
  } catch {
    return null
  }
}
