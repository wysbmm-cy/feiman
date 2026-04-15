import { promises as fs } from 'fs'
import { join, basename, extname } from 'path'
import matter from 'gray-matter'
import { v4 as uuidv4 } from 'uuid'
import type { NoteIPC, NotebookIPC, CreateNoteRequest, CreateNotebookRequest } from '../../shared/ipc-types'

const CORNELL_TEMPLATE = (title: string, topic: string) => `<!-- cornell:cues -->

<!-- /cornell:cues -->

<!-- cornell:notes -->
## ${title}

> 主题：${topic}

<!-- /cornell:notes -->

<!-- cornell:summary -->

<!-- /cornell:summary -->
`

function parseCornellSections(content: string): { cues: string; notes: string; summary: string } {
  const extract = (tag: string): string => {
    const regex = new RegExp(`<!-- cornell:${tag} -->([\\s\\S]*?)<!-- \\/cornell:${tag} -->`, 'm')
    const match = content.match(regex)
    return match ? match[1].trim() : ''
  }

  return {
    cues: extract('cues'),
    notes: extract('notes'),
    summary: extract('summary')
  }
}

function serializeCornellNote(cornell: { cues: string; notes: string; summary: string }): string {
  let content = `<!-- cornell:cues -->\n${cornell.cues}\n<!-- /cornell:cues -->\n\n`
  content += `<!-- cornell:notes -->\n${cornell.notes}\n<!-- /cornell:notes -->\n\n`
  content += `<!-- cornell:summary -->\n${cornell.summary}\n<!-- /cornell:summary -->\n`
  return content
}

function countWords(text: string): number {
  const plainText = text.replace(/<!--[\s\S]*?-->/g, '').replace(/[#*`[\]()]/g, '')
  return plainText.trim().split(/\s+/).filter(Boolean).length
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function listNotebooks(rootPath: string): Promise<NotebookIPC[]> {
  await ensureDir(rootPath)
  const indexPath = join(rootPath, 'index.json')

  try {
    const raw = await fs.readFile(indexPath, 'utf-8')
    const index = JSON.parse(raw)
    return Object.values(index.notebooks || {}) as NotebookIPC[]
  } catch {
    return []
  }
}

export async function readNote(filePath: string): Promise<NoteIPC | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const { data, content } = matter(raw)
    const cornell = parseCornellSections(content)

    let nodes = []
    if (data.nodes) {
      try {
        nodes = typeof data.nodes === 'string' ? JSON.parse(data.nodes) : data.nodes
      } catch { /* ignore parse errors */ }
    }

    return {
      id: data.id,
      notebookId: data.notebookId,
      title: data.title || basename(filePath, extname(filePath)),
      tags: data.tags || [],
      topic: data.topic || '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      overallMastery: data.overallMastery ?? null,
      wordCount: data.wordCount || countWords(content),
      filePath,
      cornell,
      nodes
    }
  } catch {
    return null
  }
}

export async function writeNote(note: NoteIPC): Promise<void> {
  const wordCount = countWords(
    [note.cornell.cues, note.cornell.notes, note.cornell.summary].join('\n')
  )

  const frontmatter = {
    id: note.id,
    notebookId: note.notebookId,
    title: note.title,
    tags: note.tags,
    topic: note.topic,
    createdAt: note.createdAt,
    updatedAt: new Date().toISOString(),
    overallMastery: note.overallMastery,
    wordCount,
    nodes: note.nodes && note.nodes.length > 0 ? JSON.stringify(note.nodes) : null
  }

  const content = serializeCornellNote(note.cornell)
  const fileContent = matter.stringify(content, frontmatter)

  await fs.writeFile(note.filePath, fileContent, 'utf-8')
}

export async function createNotebook(req: CreateNotebookRequest): Promise<NotebookIPC> {
  const id = uuidv4()
  const dirPath = join(req.rootPath, req.name.replace(/[<>:"/\\|?*]/g, '_'))
  await ensureDir(dirPath)

  const notebook: NotebookIPC = {
    id,
    name: req.name,
    description: req.description,
    color: req.color || '#6366f1',
    createdAt: new Date().toISOString(),
    directoryPath: dirPath,
    noteIds: []
  }

  await updateIndex(req.rootPath, notebook)
  return notebook
}

export async function createNote(req: CreateNoteRequest, rootPath: string): Promise<NoteIPC> {
  const notebooks = await listNotebooks(rootPath)
  const notebook = notebooks.find((nb) => nb.id === req.notebookId)
  if (!notebook) throw new Error(`Notebook not found: ${req.notebookId}`)

  const id = uuidv4()
  const safeTitle = req.title.replace(/[<>:"/\\|?*]/g, '_')
  const filePath = join(notebook.directoryPath, `${safeTitle}-${id.slice(0, 8)}.md`)
  const now = new Date().toISOString()

  const cornellContent = CORNELL_TEMPLATE(req.title, req.topic)
  const frontmatter = {
    id,
    notebookId: req.notebookId,
    title: req.title,
    tags: req.tags || [],
    topic: req.topic,
    createdAt: now,
    updatedAt: now,
    overallMastery: null,
    wordCount: 0,
    nodes: null
  }

  const fileContent = matter.stringify(cornellContent, frontmatter)
  await fs.writeFile(filePath, fileContent, 'utf-8')

  // Update notebook index
  notebook.noteIds.push(id)
  const indexPath = join(rootPath, 'index.json')
  let index: { notebooks: Record<string, NotebookIPC>; notes: Record<string, { filePath: string }> } = {
    notebooks: {},
    notes: {}
  }
  try {
    const raw = await fs.readFile(indexPath, 'utf-8')
    index = JSON.parse(raw)
  } catch { /* first time */ }

  index.notebooks[req.notebookId] = notebook
  index.notes[id] = { filePath }
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')

  const cornell = parseCornellSections(cornellContent)
  return { id, notebookId: req.notebookId, title: req.title, tags: req.tags || [], topic: req.topic, createdAt: now, updatedAt: now, overallMastery: null, wordCount: 0, filePath, cornell, nodes: [] }
}

export async function deleteNote(noteId: string, rootPath: string): Promise<void> {
  const indexPath = join(rootPath, 'index.json')
  try {
    const raw = await fs.readFile(indexPath, 'utf-8')
    const index = JSON.parse(raw)
    const noteRef = index.notes?.[noteId]
    if (noteRef?.filePath) {
      await fs.unlink(noteRef.filePath).catch(() => { })
    }
    delete index.notes?.[noteId]
    for (const nb of Object.values(index.notebooks || {}) as NotebookIPC[]) {
      nb.noteIds = nb.noteIds.filter((id) => id !== noteId)
    }
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  } catch { /* ignore */ }
}

async function updateIndex(rootPath: string, notebook: NotebookIPC): Promise<void> {
  const indexPath = join(rootPath, 'index.json')
  let index: { notebooks: Record<string, NotebookIPC>; notes: Record<string, unknown> } = { notebooks: {}, notes: {} }
  try {
    const raw = await fs.readFile(indexPath, 'utf-8')
    index = JSON.parse(raw)
  } catch { /* first time */ }

  index.notebooks[notebook.id] = notebook
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
}

export async function getNoteFilePath(noteId: string, rootPath: string): Promise<string | null> {
  const indexPath = join(rootPath, 'index.json')
  try {
    const raw = await fs.readFile(indexPath, 'utf-8')
    const index = JSON.parse(raw)
    return index.notes?.[noteId]?.filePath || null
  } catch {
    return null
  }
}
