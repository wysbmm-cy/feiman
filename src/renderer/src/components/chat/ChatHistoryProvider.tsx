import React, { useEffect } from 'react'
import { useChatHistory } from '../../hooks/useChatHistory'

interface ChatHistoryProviderProps {
  children: React.ReactNode
}

/**
 * ChatHistoryProvider - 负责在应用启动时加载聊天记录
 * 并将其包装在组件树中
 */
export function ChatHistoryProvider({ children }: ChatHistoryProviderProps) {
  const { loadChatHistory } = useChatHistory()

  useEffect(() => {
    // 应用启动时加载聊天记录
    loadChatHistory()
  }, [loadChatHistory])

  return <>{children}</>
}
