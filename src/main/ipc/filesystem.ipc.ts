import type { IpcMain } from 'electron'
import { dialog } from 'electron'
import { IPC } from '../../shared/constants'
import type { IPCResponse, CreateNoteRequest, CreateNotebookRequest } from '../../shared/ipc-types'
import {
  listNotebooks,
  readNote,
  writeNote,
  createNotebook,
  createNote,
  deleteNote,
  getNoteFilePath
} from '../services/filesystem.service'
import { getSettings } from '../services/settings.service'
import { indexNote, deleteNoteFromIndex } from '../services/rag.service'

export function registerFilesystemHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC.FS_LIST_NOTEBOOKS, async (): Promise<IPCResponse> => {
    try {
      const settings = getSettings()
      const notebooks = await listNotebooks(settings.notebooksRootPath)
      const indexPath = require('path').join(settings.notebooksRootPath, 'index.json')
      let noteRefs: Record<string, { filePath: string }> = {}
      try {
        const raw = require('fs').readFileSync(indexPath, 'utf-8')
        noteRefs = JSON.parse(raw).notes || {}
      } catch { /* ok */ }
      return { success: true, data: { notebooks, noteRefs } }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC.FS_READ_NOTE, async (_event, noteId: string): Promise<IPCResponse> => {
    try {
      const settings = getSettings()
      const filePath = await getNoteFilePath(noteId, settings.notebooksRootPath)
      if (!filePath) return { success: false, error: 'Note not found' }
      const note = await readNote(filePath)
      return { success: true, data: note }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC.FS_WRITE_NOTE, async (_event, note): Promise<IPCResponse> => {
    try {
      await writeNote(note)
      // Auto-update RAG index (fire-and-forget, best effort)
      const settings = getSettings()
      const provider =
        settings.aiProviders.find((p) => p.id === settings.activeProviderId) ||
        settings.aiProviders[0]
      const apiKey = provider?.apiKey || ''
      const baseURL = provider?.baseURL
      if (apiKey && note.id) {
        indexNote(
          {
            id: note.id,
            title: note.title || '',
            topic: note.topic || '',
            cues: note.cornell?.cues || '',
            notes: note.cornell?.notes || '',
            summary: note.cornell?.summary || '',
          },
          apiKey,
          baseURL
        ).catch((e: unknown) => console.warn('[RAG] Auto-index failed:', e))
      }
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC.FS_CREATE_NOTEBOOK, async (_event, req: CreateNotebookRequest): Promise<IPCResponse> => {
    try {
      const settings = getSettings()
      const notebook = await createNotebook({ ...req, rootPath: settings.notebooksRootPath })
      return { success: true, data: notebook }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC.FS_CREATE_NOTE, async (_event, req: CreateNoteRequest): Promise<IPCResponse> => {
    try {
      const settings = getSettings()
      const note = await createNote(req, settings.notebooksRootPath)
      return { success: true, data: note }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC.FS_DELETE_NOTE, async (_event, noteId: string): Promise<IPCResponse> => {
    try {
      const settings = getSettings()
      await deleteNote(noteId, settings.notebooksRootPath)
      // Remove from RAG index (fire-and-forget)
      const provider =
        settings.aiProviders.find((p) => p.id === settings.activeProviderId) ||
        settings.aiProviders[0]
      const apiKey = provider?.apiKey || ''
      const baseURL = provider?.baseURL
      if (apiKey) {
        deleteNoteFromIndex(noteId, apiKey, baseURL).catch((e: unknown) =>
          console.warn('[RAG] Auto-delete-index failed:', e)
        )
      }
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC.DIALOG_OPEN_DIRECTORY, async (): Promise<IPCResponse<string>> => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled) return { success: false, error: 'Cancelled' }
    return { success: true, data: result.filePaths[0] }
  })
}
