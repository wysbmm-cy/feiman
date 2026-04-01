/**
 * RAG Files Service
 * Manages metadata for user-uploaded knowledge base files (per notebook).
 * Metadata is persisted to userData/rag-files.json
 */

import { join } from 'path'
import { app } from 'electron'
import { promises as fs } from 'fs'

export interface RagFileEntry {
  id: string
  notebookId: string
  fileName: string
  fileType: 'pdf' | 'txt' | 'md'
  fileSizeBytes: number
  uploadedAt: string
  chunkCount: number
}

const getMetaPath = (): string =>
  join(app.getPath('userData'), 'rag-files.json')

async function readMeta(): Promise<RagFileEntry[]> {
  try {
    const raw = await fs.readFile(getMetaPath(), 'utf-8')
    return JSON.parse(raw) as RagFileEntry[]
  } catch {
    return []
  }
}

async function writeMeta(entries: RagFileEntry[]): Promise<void> {
  await fs.writeFile(getMetaPath(), JSON.stringify(entries, null, 2), 'utf-8')
}

export async function listRagFiles(notebookId?: string): Promise<RagFileEntry[]> {
  const all = await readMeta()
  return notebookId ? all.filter((e) => e.notebookId === notebookId) : all
}

export async function addRagFile(entry: RagFileEntry): Promise<void> {
  const all = await readMeta()
  // Replace if same id exists
  const filtered = all.filter((e) => e.id !== entry.id)
  await writeMeta([...filtered, entry])
}

export async function removeRagFile(fileId: string): Promise<void> {
  const all = await readMeta()
  await writeMeta(all.filter((e) => e.id !== fileId))
}
