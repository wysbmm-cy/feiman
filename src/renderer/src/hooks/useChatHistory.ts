import { useCallback, useEffect } from 'react'
import { useStore } from '../store'
import { useElectron } from './useElectron'

export function useChatHistory() {
  const api = useElectron()
  const { 
    sessions, 
    currentSessionId, 
    setSessions, 
    createSession, 
    deleteSession, 
    addMessageToSession,
    updateSessionTitle,
    setCurrentSession 
  } = useStore()

  // 加载聊天记录
  const loadChatHistory = useCallback(async () => {
    if (!api) return
    try {
      const res = await api.getChatHistory()
      if (res.success && res.data) {
        setSessions(res.data)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }, [api, setSessions])

  // 保存聊天记录
  const saveChatHistory = useCallback(async () => {
    if (!api || sessions.length === 0) return
    try {
      await api.setChatHistory(sessions)
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }, [api, sessions])

  // 删除会话（带持久化）
  const deleteSessionWithPersist = useCallback(async (sessionId: string) => {
    deleteSession(sessionId)
    if (api) {
      try {
        await api.deleteChatSession(sessionId)
      } catch (error) {
        console.error('Failed to delete chat session:', error)
      }
    }
  }, [deleteSession, api])

  // 创建会话（自动生成标题）
  const createSessionWithAutoTitle = useCallback((noteId: string | null, firstMessage?: string) => {
    const title = firstMessage 
      ? firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '')
      : '新对话'
    return createSession(noteId, title)
  }, [createSession])

  // 添加到当前会话
  const addToCurrentSession = useCallback((role: 'user' | 'assistant', content: string) => {
    if (!currentSessionId) {
      // 如果没有当前会话，创建一个新会话
      const newSessionId = createSessionWithAutoTitle(null, content)
      addMessageToSession(newSessionId, { role, content })
      return newSessionId
    } else {
      addMessageToSession(currentSessionId, { role, content })
      return currentSessionId
    }
  }, [currentSessionId, createSessionWithAutoTitle, addMessageToSession])

  return {
    // 状态
    sessions,
    currentSessionId,
    
    // 基础操作
    loadChatHistory,
    saveChatHistory,
    setSessions,
    setCurrentSession,
    
    // 会话管理
    createSession,
    createSessionWithAutoTitle,
    deleteSession: deleteSessionWithPersist,
    updateSessionTitle,
    
    // 消息操作
    addMessageToSession,
    addToCurrentSession,
    
    // 工具函数
    getCurrentSession: () => sessions.find(s => s.id === currentSessionId),
    getSessionsByNoteId: (noteId: string | null) => sessions.filter(s => s.noteId === noteId),
  }
}
