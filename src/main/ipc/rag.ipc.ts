import type { IpcMain } from 'electron'
import { IPC } from '../../shared/constants'
import type { IPCResponse, RagSearchResult } from '../../shared/ipc-types'
import { indexNote, deleteNoteFromIndex, searchIndex } from '../services/rag.service'
import { getSettings } from '../services/settings.service'

/** Get the API key and base URL from the currently active provider. */
function getActiveProviderCreds(): { apiKey: string; baseURL: string } | null {
  const settings = getSettings()
  const provider =
    settings.aiProviders.find((p) => p.id === settings.activeProviderId) ||
    settings.aiProviders[0]
  if (!provider?.apiKey) return null
  return { apiKey: provider.apiKey, baseURL: provider.baseURL }
}

export function registerRagHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC.RAG_INDEX_NOTE, async (_event, note): Promise<IPCResponse> => {
    try {
      const creds = getActiveProviderCreds()
      if (!creds) return { success: false, error: 'No API key configured' }
      await indexNote(note, creds.apiKey, creds.baseURL)
      return { success: true }
    } catch (e) {
      console.error('[RAG IPC] index-note error:', e)
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC.RAG_DELETE_NOTE, async (_event, noteId: string): Promise<IPCResponse> => {
    try {
      const creds = getActiveProviderCreds()
      if (!creds) return { success: false, error: 'No API key configured' }
      await deleteNoteFromIndex(noteId, creds.apiKey, creds.baseURL)
      return { success: true }
    } catch (e) {
      console.error('[RAG IPC] delete-note error:', e)
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(
    IPC.RAG_SEARCH,
    async (_event, query: string, topK?: number): Promise<IPCResponse<RagSearchResult[]>> => {
      try {
        const creds = getActiveProviderCreds()
        if (!creds) return { success: false, error: 'No API key configured' }
        const results = await searchIndex(query, creds.apiKey, topK ?? 3, creds.baseURL)
        return { success: true, data: results }
      } catch (e) {
        console.error('[RAG IPC] search error:', e)
        return { success: false, error: String(e) }
      }
    }
  )
}
