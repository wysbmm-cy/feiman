import type { StateCreator } from 'zustand'
import type { ChatHistorySession, ChatHistoryMessage } from '../../types/chat-history.types'
import { generateId } from '../../lib/utils'

export interface ChatHistorySlice {
  sessions: ChatHistorySession[]
  currentSessionId: string | null

  // Actions
  setSessions: (sessions: ChatHistorySession[]) => void
  createSession: (noteId: string | null, title?: string) => string
  deleteSession: (sessionId: string) => void
  addMessageToSession: (sessionId: string, message: Omit<ChatHistoryMessage, 'id' | 'timestamp'>) => void
  clearSessionMessages: (sessionId: string) => void
  setCurrentSession: (sessionId: string | null) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  getSession: (sessionId: string) => ChatHistorySession | undefined
  getSessionsByNoteId: (noteId: string | null) => ChatHistorySession[]
}

export const createChatHistorySlice: StateCreator<ChatHistorySlice, [], [], ChatHistorySlice> = (set, get) => ({
  sessions: [],
  currentSessionId: null,

  setSessions: (sessions) => set({ sessions }),

  updateSessionTitle: (sessionId, title) => {
    set((state) => ({
      sessions: state.sessions.map(s => s.id === sessionId ? { ...s, title } : s)
    }))
  },

  createSession: (noteId, title = '新对话') => {
    const id = generateId()
    const now = new Date().toISOString()
    const newSession: ChatHistorySession = {
      id,
      noteId,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now
    }
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSessionId: id,
      // @ts-ignore - 同步 AI 消息列表
      messages: []
    }))
    return id
  },

  deleteSession: (sessionId) => {
    set((state) => {
      const newSessions = state.sessions.filter(s => s.id !== sessionId)
      const newCurrentId = state.currentSessionId === sessionId 
        ? (newSessions[0]?.id || null)
        : state.currentSessionId
      
      const session = newSessions.find(s => s.id === newCurrentId)
      return {
        sessions: newSessions,
        currentSessionId: newCurrentId,
        // @ts-ignore - 同步 AI 消息列表
        messages: session ? session.messages : []
      }
    })
  },

  addMessageToSession: (sessionId, message) => {
    const newMessage: ChatHistoryMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString()
    }
    set((state) => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId 
          ? {
              ...s,
              messages: [...s.messages, newMessage],
              updatedAt: new Date().toISOString()
            }
          : s
      )
    }))
  },

  clearSessionMessages: (sessionId: string) => {
    set((state) => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [], updatedAt: new Date().toISOString() }
          : s
      )
    }))
  },

  setCurrentSession: (sessionId) => {
    const { sessions } = get()
    const session = sessions.find(s => s.id === sessionId)
    set({ 
      currentSessionId: sessionId,
      // @ts-ignore - 混合 Slice 的状态同步
      messages: session ? session.messages : []
    })
  },

  getSession: (sessionId) => {
    return get().sessions.find(s => s.id === sessionId)
  },

  getSessionsByNoteId: (noteId) => {
    return get().sessions.filter(s => s.noteId === noteId)
  }
})