import React from 'react'
import ReactMarkdown from 'react-markdown'
import { remarkPlugins, rehypePluginsSimple } from '../../lib/markdown-plugins'
import { NeuralSyncCard } from './NeuralSyncCard'
import { useStore } from '../../store'

interface StudentMessageProps {
  role: 'student' | 'user' | 'assistant'
  content: string
  reasoning?: string
  isStreaming?: boolean
}

export function StudentMessage({ role, content, reasoning, isStreaming }: StudentMessageProps) {
  const isStudent = role === 'student' || role === 'assistant'
  const { updateCornellContent, updateCppFile, activeCppFileId } = useStore()

  // Neural Sync Parsing
  const actionMatch = content.match(/\[ACTION: (UPDATE_NOTE|UPDATE_CODE)\]\s*```json\s*([\s\S]*?)\s*```/)
  const actionType = actionMatch?.[1]
  const actionDataStr = actionMatch?.[2]
  let actionData: any = null
  
  if (actionDataStr) {
    try {
      actionData = JSON.parse(actionDataStr)
    } catch (e) {
      console.error('Failed to parse Neural Sync Action Data', e)
    }
  }

  // Clean content - remove the action block from visible message
  const cleanContent = content.replace(/\[ACTION: (UPDATE_NOTE|UPDATE_CODE)\]\s*```json[\s\S]*?```/, '').trim()
  const cleanReasoning = (reasoning || '').trim()

  const handleSync = () => {
    if (!actionData) return
    if (actionType === 'UPDATE_NOTE' && actionData.cornell) {
      updateCornellContent(actionData.cornell)
    } else if (actionType === 'UPDATE_CODE' && actionData.code && activeCppFileId) {
      updateCppFile(activeCppFileId, { code: actionData.code }, true, 'Neural Sync 同步');
    }
  }

  return (
    <div className={`flex flex-col gap-1 mb-1.5 ${isStudent ? 'pr-3' : 'pl-3 items-end'}`}>
      {/* Sender Label - Minimal */}
      <div className="flex items-center gap-1.5 text-[9px] font-medium opacity-60">
        {isStudent ? (
          <>
            <div className="w-1 h-1 rounded-full" style={{ background: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--accent-primary)' }}>小方</span>
          </>
        ) : (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>你</span>
            <div className="w-1 h-1 rounded-full" style={{ background: 'var(--text-secondary)' }} />
          </>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className="px-2.5 py-2 text-xs rounded-lg selectable"
        style={{
          background: isStudent
            ? 'color-mix(in srgb, var(--primary-color), transparent 94%)'
            : 'var(--bg-elevated)',
          border: `1px solid ${isStudent ? 'var(--border-subtle)' : 'var(--border-subtle)'}`,
          color: 'var(--text-primary)',
          lineHeight: 1.6
        }}
      >
        {/* Reasoning Block - Compact */}
        {isStudent && cleanReasoning && (
          <div
            className="mb-1.5 rounded px-2 py-1.5 text-[10px]"
            style={{
              background: 'color-mix(in srgb, var(--warning), transparent 94%)',
              border: '1px dashed color-mix(in srgb, var(--warning), transparent 60%)',
              color: 'var(--text-secondary)'
            }}
          >
            <div className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
              思考
            </div>
            <div className="whitespace-pre-wrap leading-5 opacity-80">{cleanReasoning}</div>
          </div>
        )}

        {/* Content */}
        <ReactMarkdown
          className="prose prose-sm selectable"
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePluginsSimple}
        >
          {cleanContent || content}
        </ReactMarkdown>
        
        {/* Streaming Cursor */}
        {isStreaming && (
          <span
            className="inline-block w-1 h-3 ml-0.5 rounded-sm align-middle"
            style={{
              background: 'var(--accent-primary)',
              animation: 'blink 1s step-end infinite',
            }}
          />
        )}
      </div>

      {/* Neural Sync Card */}
      {actionType && actionData && !isStreaming && (
        <NeuralSyncCard
          type={actionType === 'UPDATE_NOTE' ? 'note' : 'code'}
          title={actionType === 'UPDATE_NOTE' ? '笔记同步' : '代码同步'}
          content={actionData}
          onSync={handleSync}
        />
      )}
    </div>
  )
}
