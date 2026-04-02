import React from 'react'
import ReactMarkdown from 'react-markdown'
import { remarkPlugins, rehypePluginsSimple } from '../../lib/markdown-plugins'
import { User, Bot } from 'lucide-react'
import type { AIMessage as AIMessageType } from '../../types'
import { formatDate } from '../../lib/utils'

interface AIMessageProps {
  message: AIMessageType
}

export function AIMessage({ message }: AIMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{
          background: isUser ? 'var(--accent-muted)' : 'var(--bg-elevated)',
          color: isUser ? 'var(--accent-primary)' : 'var(--text-muted)'
        }}
      >
        {isUser ? <User size={12} /> : <Bot size={12} />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={{
          background: isUser ? 'var(--accent-muted)' : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'transparent' : 'var(--border-subtle)'}`
        }}
      >
        {message.error ? (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{message.error}</p>
        ) : (
          <div
            className="prose text-xs selectable"
            style={{ color: isUser ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePluginsSimple}>
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
              <span
                className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse-accent"
                style={{ background: 'var(--accent-primary)', verticalAlign: 'text-bottom' }}
              />
            )}
          </div>
        )}
        <div
          className="text-[10px] mt-1"
          style={{ color: 'var(--text-disabled)' }}
        >
          {formatDate(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
