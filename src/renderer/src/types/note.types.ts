import type { KnowledgeNode } from './node.types'

export interface CornellContent {
  cues: string
  notes: string
  summary: string
}

export interface NoteMetadata {
  id: string
  notebookId: string
  title: string
  tags: string[]
  topic: string
  createdAt: string
  updatedAt: string
  overallMastery: number | null
  wordCount: number
  filePath: string
}

export interface Note extends NoteMetadata {
  cornell: CornellContent
  nodes: KnowledgeNode[]
}

export interface Notebook {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: string
  directoryPath: string
  noteIds: string[]
}
