import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants'
import type { IPCResponse, NoteIPC, CreateNoteRequest, CreateNotebookRequest, ChatHistorySessionIPC, RagSearchResult, RagIndexNoteInput, RagFileEntry } from '../shared/ipc-types'

const electronAPI = {
  // Filesystem
  listNotebooks: (): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.FS_LIST_NOTEBOOKS),

  readNote: (noteId: string): Promise<IPCResponse<NoteIPC>> =>
    ipcRenderer.invoke(IPC.FS_READ_NOTE, noteId),

  writeNote: (note: NoteIPC): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.FS_WRITE_NOTE, note),

  createNotebook: (req: CreateNotebookRequest): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.FS_CREATE_NOTEBOOK, req),

  createNote: (req: CreateNoteRequest): Promise<IPCResponse<NoteIPC>> =>
    ipcRenderer.invoke(IPC.FS_CREATE_NOTE, req),

  deleteNote: (noteId: string): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.FS_DELETE_NOTE, noteId),

  openDirectoryDialog: (): Promise<IPCResponse<string>> =>
    ipcRenderer.invoke(IPC.DIALOG_OPEN_DIRECTORY),

  // Settings
  getSettings: (): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.SETTINGS_GET),

  setSettings: (partial: Record<string, unknown>): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, partial),

  // Chat History
  getChatHistory: (): Promise<IPCResponse<ChatHistorySessionIPC[]>> =>
    ipcRenderer.invoke(IPC.CHAT_HISTORY_GET),

  setChatHistory: (sessions: ChatHistorySessionIPC[]): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.CHAT_HISTORY_SET, sessions),

  deleteChatSession: (sessionId: string): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.CHAT_HISTORY_DELETE, sessionId),

  clearChatHistory: (): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.CHAT_HISTORY_CLEAR),

  // Window controls
  minimize: (): void => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
  maximize: (): void => ipcRenderer.send(IPC.WINDOW_MAXIMIZE),
  close: (): void => ipcRenderer.send(IPC.WINDOW_CLOSE),

  // RAG
  ragIndexNote: (note: RagIndexNoteInput): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.RAG_INDEX_NOTE, note),

  ragDeleteNote: (noteId: string): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.RAG_DELETE_NOTE, noteId),

  ragSearch: (query: string, topK?: number): Promise<IPCResponse<RagSearchResult[]>> =>
    ipcRenderer.invoke(IPC.RAG_SEARCH, query, topK),

  // RAG — knowledge base files
  ragUploadFile: (notebookId: string): Promise<IPCResponse<RagFileEntry>> =>
    ipcRenderer.invoke(IPC.RAG_UPLOAD_FILE, notebookId),

  ragListFiles: (notebookId?: string): Promise<IPCResponse<RagFileEntry[]>> =>
    ipcRenderer.invoke(IPC.RAG_LIST_FILES, notebookId),

  ragDeleteFile: (fileId: string): Promise<IPCResponse> =>
    ipcRenderer.invoke(IPC.RAG_DELETE_FILE, fileId),

  // Platform info
  platform: process.platform
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
