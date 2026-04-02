/**
 * RAG Service — Rebuilt using Orama for lightweight and reliable vector search in Electron.
 * 
 * Bypasses LlamaIndex completely.
 * Uses native OpenAI SDK for embeddings.
 * Persists Orama index as JSON in the user data directory.
 */

import { join } from 'path'
import { app } from 'electron'
import { promises as fs } from 'fs'
import { create, insert, search, remove, count, type AnyOrama, insertMultiple } from '@orama/orama'
import { persist, restore } from '@orama/plugin-data-persistence'
import OpenAI from 'openai'

export interface RagIndexNoteInput {
  id: string
  title: string
  topic: string
  cues: string
  notes: string
  summary: string
}

export interface RagSearchResult {
  noteId: string
  noteTitle: string
  section: 'cues' | 'notes' | 'summary'
  text: string
  score: number
}

// Module-level state
let _db: AnyOrama | null = null
let _openaiClient: OpenAI | null = null
let _currentApiKey: string | null = null
let _currentBaseURL: string | null = null
let _currentEmbeddingModel: string | null = null

// 默认 embedding 模型
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'

function getStorageDir(): string {
  return join(app.getPath('userData'), 'rag-index')
}

function getIndexPath(): string {
  return join(getStorageDir(), 'orama_index.json')
}

/**
 * Generate embeddings using the native OpenAI SDK.
 * 支持自定义 embedding 模型。
 */
async function generateEmbeddings(texts: string[], embeddingModel?: string): Promise<number[][]> {
  if (!_openaiClient) throw new Error('OpenAI client not initialized')
  
  const model = embeddingModel || _currentEmbeddingModel || DEFAULT_EMBEDDING_MODEL
  
  try {
    const response = await _openaiClient.embeddings.create({
      model,
      input: texts,
    })
    
    return response.data
      .sort((a, b) => a.index - b.index)
      .map(item => item.embedding)
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    const statusCode = error?.status || error?.statusCode
    
    await logToFile(`Embedding API error (${model}): ${errorMsg}`)
    
    // 提供更友好的错误提示
    if (statusCode === 404 || errorMsg.includes('404') || errorMsg.includes('not found')) {
      throw new Error(`Embedding 模型 "${model}" 不支持。\n\n解决方案：\n1. 在设置中修改 Embedding 模型为您的 API 提供商支持的模型\n2. 或添加一个支持 Embedding 的 AI 提供商（如 OpenAI）\n\n提示：DeepSeek、Kimi 等兼容 OpenAI 接口，可使用 text-embedding-3-small`)
    }
    
    if (statusCode === 401 || errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('invalid')) {
      throw new Error('API Key 无效或未授权访问 Embedding API。\n\n请检查您的 API Key 是否正确配置。')
    }
    
    if (statusCode === 429 || errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
      throw new Error('Embedding API 调用频率超限或配额不足。\n\n请稍后重试或升级您的 API 计划。')
    }
    
    throw new Error(`Embedding API 调用失败 (模型: ${model}): ${errorMsg}\n\n如果您的 API 提供商不支持 Embedding，请在设置中配置一个支持的提供商。`)
  }
}

/**
 * Initialize the Orama database. 
 * Loads existing index from disk if it exists.
 */
export async function initRagService(apiKey: string, baseURL?: string, embeddingModel?: string): Promise<void> {
  if (_db && _currentApiKey === apiKey && _currentBaseURL === (baseURL ?? null) && _currentEmbeddingModel === (embeddingModel ?? null)) return

  _currentApiKey = apiKey
  _currentBaseURL = baseURL ?? null
  _currentEmbeddingModel = embeddingModel ?? null
  const storageDir = getStorageDir()
  await fs.mkdir(storageDir, { recursive: true })

  _openaiClient = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  })

  const indexPath = getIndexPath()
  try {
    await fs.mkdir(getStorageDir(), { recursive: true })
    const stat = await fs.stat(indexPath)
    if (stat.isFile()) {
      const indexData = await fs.readFile(indexPath, 'utf-8')
      _db = await restore('json', indexData)
      await logToFile('Orama index restored from disk.')
    }
  } catch (e) {
    await logToFile(`Failed to restore index, creating new: ${String(e)}`)
    // No index found or failed to load — create new
    _db = await create({
      schema: {
        id: 'string',
        text: 'string',
        noteId: 'string',
        noteTitle: 'string',
        topic: 'string',
        section: 'string',
        fileId: 'string',
        fileName: 'string',
        embedding: 'vector[1536]'
      }
    })
  }
}

async function saveIndex(): Promise<void> {
  if (!_db) return
  const indexData = await persist(_db, 'json')
  await fs.writeFile(getIndexPath(), indexData as string, 'utf-8')
}

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 150

/**
 * Recursive Character Text Splitter (Simple version)
 */
function splitText(text: string): string[] {
  const chunks: string[] = []
  const separators = ['\n\n', '\n', '。', '？', '！', ' ', '']
  
  let currentStart = 0
  if (text.length <= CHUNK_SIZE) {
    return [text]
  }

  while (currentStart < text.length) {
    let end = Math.min(currentStart + CHUNK_SIZE, text.length)
    
    // Try to find a good breaking point if not at the true end
    if (end < text.length) {
      for (const sep of separators) {
        const lastIndex = text.lastIndexOf(sep, end)
        // Only break if the separator is in the second half of the chunk to avoid tiny chunks
        if (lastIndex > currentStart + CHUNK_SIZE / 2) {
          end = lastIndex + sep.length
          break
        }
      }
    }
    
    const chunk = text.substring(currentStart, end).trim()
    if (chunk.length > 5) {
      chunks.push(chunk)
    }

    const nextStart = end - CHUNK_OVERLAP
    // Ensure we actually move forward to avoid infinite loops
    if (nextStart <= currentStart) {
      currentStart = end
    } else {
      currentStart = nextStart
    }

    if (currentStart >= text.length - 10) break
  }
  return chunks
}

/**
 * Index raw text (PDF/TXT/MD).
 */
export async function indexRawText(
  fileId: string,
  fileName: string,
  text: string,
  apiKey: string,
  baseURL?: string,
  embeddingModel?: string
): Promise<number> {
  await initRagService(apiKey, baseURL, embeddingModel)
  if (!_db) throw new Error('DB not initialized')

  // Cleanup old chunks for this file
  const searchRes = await search(_db, {
    where: { fileId: fileId },
    limit: 1000
  })
  for (const hit of searchRes.hits) {
    await remove(_db, hit.id)
  }

  const chunks = splitText(text)
  if (chunks.length === 0) return 0

  const processedChunks = chunks.map((c, i) => `[${fileName} — 第${i + 1}段]\n${c.trim()}`)
  const embeddings = await generateEmbeddings(processedChunks, embeddingModel)

  const docs = processedChunks.map((t, i) => ({
    id: `${fileId}::chunk${i}`,
    text: t,
    fileId,
    fileName,
    noteId: '',
    noteTitle: fileName,
    topic: '',
    section: 'notes',
    embedding: embeddings[i]
  }))

  await insertMultiple(_db, docs)
  await saveIndex()

  console.log(`[RAG] Indexed file "${fileName}" — ${docs.length} chunk(s)`)
  return docs.length
}

export async function deleteFileFromIndex(fileId: string, apiKey: string, baseURL?: string, embeddingModel?: string): Promise<void> {
  await initRagService(apiKey, baseURL, embeddingModel)
  if (!_db) return

  const searchRes = await search(_db, {
    where: { fileId: fileId },
    limit: 1000
  })
  for (const hit of searchRes.hits) {
    await remove(_db, hit.id)
  }
  await saveIndex()
}

/**
 * Index a Cornell Note.
 */
export async function indexNote(note: RagIndexNoteInput, apiKey: string, baseURL?: string, embeddingModel?: string): Promise<void> {
  await initRagService(apiKey, baseURL, embeddingModel)
  if (!_db) return

  // Cleanup old version
  const searchRes = await search(_db, {
    where: { noteId: note.id },
    limit: 10
  })
  for (const hit of searchRes.hits) {
    await remove(_db, hit.id)
  }

  const sections: Array<{ key: 'cues' | 'notes' | 'summary'; text: string; label: string }> = [
    { key: 'cues' as const, text: note.cues, label: '关键词/提示' },
    { key: 'notes' as const, text: note.notes, label: '主笔记' },
    { key: 'summary' as const, text: note.summary, label: '总结' },
  ].filter(s => s.text?.trim().length > 10) as Array<{ key: 'cues' | 'notes' | 'summary'; text: string; label: string }>

  if (sections.length === 0) return

  const texts = sections.map(sec => `[${note.title}（${sec.label}）]\n${sec.text.trim()}`)
  const embeddings = await generateEmbeddings(texts, embeddingModel)

  const docs = sections.map((sec, i) => ({
    id: `${note.id}::${sec.key}`,
    text: texts[i],
    noteId: note.id,
    noteTitle: note.title,
    topic: note.topic,
    section: sec.key,
    fileId: '',
    fileName: '',
    embedding: embeddings[i]
  }))

  await insertMultiple(_db, docs)
  await saveIndex()
  console.log(`[RAG] Indexed note "${note.title}" — ${docs.length} chunk(s)`)
}

export async function deleteNoteFromIndex(noteId: string, apiKey: string, baseURL?: string, embeddingModel?: string): Promise<void> {
  await initRagService(apiKey, baseURL, embeddingModel)
  if (!_db) return
  const searchRes = await search(_db, {
    where: { noteId: noteId },
    limit: 10
  })
  for (const hit of searchRes.hits) {
    await remove(_db, hit.id)
  }
  await saveIndex()
}

export async function logToFile(message: string): Promise<void> {
  const logPath = join(getStorageDir(), 'rag_search.log')
  const timestamp = new Date().toISOString()
  await fs.appendFile(logPath, `[${timestamp}] ${message}\n`)
}

/**
 * Vector search across all indexed data.
 */
export async function searchIndex(
  query: string,
  apiKey: string,
  topK = 5,
  baseURL?: string,
  embeddingModel?: string
): Promise<RagSearchResult[]> {
  await initRagService(apiKey, baseURL, embeddingModel)
  if (!_db) {
    await logToFile('ERROR: DB not initialized')
    return []
  }

  try {
    const docCount = await count(_db)
    await logToFile(`SEARCH START: query="${query}", docs_in_db=${docCount}`)
    
    // 1. Generate query embedding
    const embeddings = await generateEmbeddings([query], embeddingModel)
    const queryEmbedding = embeddings[0]

    // 2. Prepare search options
    const searchOptions: any = {
      limit: topK,
    }

    // Determine search mode based on embedding availability and dimension
    // Default Orama schema expectation is 1536 (OpenAI standard)
    if (queryEmbedding && queryEmbedding.length === 1536) {
      searchOptions.mode = 'hybrid'
      searchOptions.term = query
      searchOptions.vector = {
        value: queryEmbedding,
        property: 'embedding'
      }
      searchOptions.similarity = 0.35
      await logToFile(`SEARCH MODE: hybrid (vector+term)`)
    } else {
      // Fallback to purely keyword search if vector is unavailable or dimension mismatch
      searchOptions.mode = 'fulltext' // Note: Orama uses default if mode not vector/hybrid
      searchOptions.term = query
      await logToFile(`SEARCH MODE: keyword-only (vector failed or dimension mismatch: got ${queryEmbedding?.length || 0})`)
    }

    const results = await search(_db, searchOptions)

    await logToFile(`SEARCH RESULTS: found=${results.count}`)

    return results.hits.map((hit: any) => {
      // Log hit for debugging if needed
      logToFile(`HIT: ${hit.document.noteTitle || 'untitled'}, score=${hit.score}`).catch(() => {})
      
      return {
        noteId: (hit.document.noteId as string) || '',
        noteTitle: (hit.document.noteTitle as string) || (hit.document.fileName as string) || '未知资料',
        section: (hit.document.section as any) || 'notes',
        text: (hit.document.text as string) || '',
        score: hit.score || 0
      }
    }) as RagSearchResult[]
  } catch (err) {
    await logToFile(`SEARCH ERROR: ${String(err)}`)
    return []
  }
}
