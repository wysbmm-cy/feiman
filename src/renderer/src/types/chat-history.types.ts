export interface ChatHistoryMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatHistorySession {
  id: string
  noteId: string | null
  title: string
  messages: ChatHistoryMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatHistoryState {
  sessions: ChatHistorySession[]
  currentSessionId: string | null
}

export interface ChatHistorySlice {
  sessions: ChatHistorySession[]
  currentSessionId: string | null
  
  createSession: (noteId: string | null, title?: string) => string
  deleteSession: (sessionId: string) => void
  addMessageToSession: (sessionId: string, message: Omit<ChatHistoryMessage, 'id' | 'timestamp'>) => void
  clearSession: (sessionId: string) => void
  setCurrentSession: (sessionId: string | null) => void
  getSession: (sessionId: string) => ChatHistorySession | undefined
  getSessionsByNoteId: (noteId: string | null) => ChatHistorySession[]
}