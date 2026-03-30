import React from 'react'
import { useStore } from '../../store'
import { MessageSquare, Trash2, Plus } from 'lucide-react'

interface ChatHistoryListProps {
  onSelect?: () => void
}

export function ChatHistoryList({ onSelect }: ChatHistoryListProps) {
  const { sessions, currentSessionId, setCurrentSession, createSession, deleteSession } = useStore()

  if (sessions.length === 0) {
    return (
      <div 
        className="p-4 text-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
        <p>暂无聊天记录</p>
        <p className="mt-1 text-[10px]">开始对话后自动保存</p>
      </div>
    )
  }

  const handleNewChat = () => {
    createSession(null, '新对话')
    onSelect?.()
  }

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const getPreview = (content: string) => {
    return content.slice(0, 50) + (content.length > 50 ? '...' : '')
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleNewChat}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
        style={{ 
          color: 'var(--accent-primary)',
          background: 'color-mix(in srgb, var(--accent-primary), transparent 90%)'
        }}
      >
        <Plus size={14} />
        <span>新建对话</span>
      </button>

      <div className="max-h-[200px] overflow-y-auto space-y-1 mt-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all ${
              currentSessionId === session.id ? 'ring-1' : ''
            }`}
            style={{ 
              background: currentSessionId === session.id 
                ? 'var(--bg-elevated)' 
                : 'transparent',
              border: currentSessionId === session.id 
                ? '1px solid var(--accent-primary)'
                : '1px solid var(--border-subtle)'
            }}
            onClick={() => {
              setCurrentSession(session.id)
              onSelect?.()
            }}
          >
            <MessageSquare size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <div className="flex-1 min-w-0">
              <div 
                className="text-xs font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {session.title}
              </div>
              <div 
                className="text-[10px] truncate mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {session.messages.length > 0 
                  ? getPreview(session.messages[session.messages.length - 1].content)
                  : '空对话'}
              </div>
              <div 
                className="text-[10px] mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {formatDate(session.updatedAt)}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteSession(session.id)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-opacity"
              title="删除对话"
            >
              <Trash2 size={12} className="text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatHistoryList