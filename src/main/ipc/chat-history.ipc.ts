import type { IpcMain } from 'electron'
import type { IPCResponse, ChatHistorySessionIPC } from '../../shared/ipc-types'
import { IPC } from '../../shared/constants'
import * as chatHistoryService from '../services/chat-history.service'

export function registerChatHistoryHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC.CHAT_HISTORY_GET, (): IPCResponse<ChatHistorySessionIPC[]> => {
    try {
      const sessions = chatHistoryService.getChatHistory()
      return { success: true, data: sessions }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC.CHAT_HISTORY_SET, (_, sessions: ChatHistorySessionIPC[]): IPCResponse => {
    try {
      chatHistoryService.setChatHistory(sessions)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC.CHAT_HISTORY_DELETE, (_, sessionId: string): IPCResponse => {
    try {
      chatHistoryService.deleteChatHistorySession(sessionId)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC.CHAT_HISTORY_CLEAR, (): IPCResponse => {
    try {
      chatHistoryService.clearChatHistory()
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}