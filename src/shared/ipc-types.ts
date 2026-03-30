export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface NoteMetaIPC {
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

export interface NoteIPC extends NoteMetaIPC {
  cornell: {
    cues: string
    notes: string
    summary: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: any[]
}

export interface NotebookIPC {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: string
  directoryPath: string
  noteIds: string[]
}

export interface CreateNoteRequest {
  notebookId: string
  title: string
  topic: string
  tags?: string[]
}

export interface CreateNotebookRequest {
  name: string
  description?: string
  color?: string
  rootPath: string
}

export interface ChatHistoryMessageIPC {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatHistorySessionIPC {
  id: string
  noteId: string | null
  title: string
  messages: ChatHistoryMessageIPC[]
  createdAt: string
  updatedAt: string
}

export interface RagSearchResult {
  noteId: string
  noteTitle: string
  section: 'cues' | 'notes' | 'summary'
  text: string
  score: number
}

export interface ElectronAPI {
  listNotebooks: () => Promise<IPCResponse>
  readNote: (noteId: string) => Promise<IPCResponse<NoteIPC>>
  writeNote: (note: NoteIPC) => Promise<IPCResponse>
  createNotebook: (req: CreateNotebookRequest) => Promise<IPCResponse>
  createNote: (req: CreateNoteRequest) => Promise<IPCResponse<NoteIPC>>
  deleteNote: (noteId: string) => Promise<IPCResponse>
  openDirectoryDialog: () => Promise<IPCResponse<string>>
  getSettings: () => Promise<IPCResponse>
  setSettings: (partial: Record<string, unknown>) => Promise<IPCResponse>
  getChatHistory: () => Promise<IPCResponse<ChatHistorySessionIPC[]>>
  setChatHistory: (sessions: ChatHistorySessionIPC[]) => Promise<IPCResponse>
  deleteChatSession: (sessionId: string) => Promise<IPCResponse>
  clearChatHistory: () => Promise<IPCResponse>
  // RAG
  ragIndexNote: (note: RagIndexNoteInput) => Promise<IPCResponse>
  ragDeleteNote: (noteId: string) => Promise<IPCResponse>
  ragSearch: (query: string, topK?: number) => Promise<IPCResponse<RagSearchResult[]>>
  // RAG — knowledge base files
  ragUploadFile: (notebookId: string) => Promise<IPCResponse<RagFileEntry>>
  ragListFiles: (notebookId?: string) => Promise<IPCResponse<RagFileEntry[]>>
  ragDeleteFile: (fileId: string) => Promise<IPCResponse>
  minimize: () => void
  maximize: () => void
  close: () => void
  platform: string
}

export interface RagFileEntry {
  id: string
  notebookId: string
  fileName: string
  fileType: 'pdf' | 'txt' | 'md'
  fileSizeBytes: number
  uploadedAt: string
  chunkCount: number
}

export interface RagIndexNoteInput {
  id: string
  title: string
  topic: string
  cues: string
  notes: string
  summary: string
}
