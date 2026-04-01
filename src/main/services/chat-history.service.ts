import Store from 'electron-store'
import type { ChatHistorySessionIPC } from '../../shared/ipc-types'

interface ChatHistoryStore {
  sessions: ChatHistorySessionIPC[]
}

const defaultHistoryStore: ChatHistoryStore = {
  sessions: []
}

const historyStore = new Store<ChatHistoryStore>({
  name: 'feiman-chat-history',
  defaults: defaultHistoryStore
})

export function getChatHistory(): ChatHistorySessionIPC[] {
  return historyStore.get('sessions', [])
}

export function setChatHistory(sessions: ChatHistorySessionIPC[]): void {
  historyStore.set('sessions', sessions)
}

export function addChatHistorySession(session: ChatHistorySessionIPC): void {
  const sessions = getChatHistory()
  sessions.unshift(session)
  setChatHistory(sessions)
}

export function updateChatHistorySession(sessionId: string, updates: Partial<ChatHistorySessionIPC>): void {
  const sessions = getChatHistory()
  const index = sessions.findIndex(s => s.id === sessionId)
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates }
    setChatHistory(sessions)
  }
}

export function deleteChatHistorySession(sessionId: string): void {
  const sessions = getChatHistory().filter(s => s.id !== sessionId)
  setChatHistory(sessions)
}

export function clearChatHistory(): void {
  setChatHistory([])
}