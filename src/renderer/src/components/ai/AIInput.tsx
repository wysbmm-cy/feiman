import React, { useState, useRef } from 'react'
import { Send, Square } from 'lucide-react'
import { useStore } from '../../store'
import { useAI } from '../../hooks/useAI'
import { QUICK_PROMPTS } from '../../lib/ai/prompts'
import { VoiceInputSimple as VoiceInput } from '../audio/VoiceInputSimple'

export function AIInput() {
  const { activeNote, isStreaming } = useStore()
  const { sendMessage, abort, hasProvider } = useAI()
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return
    const msg = input.trim()
    setInput('')
    await sendMessage(msg)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickPrompt = (template: (note: typeof activeNote) => string) => {
    if (!activeNote) return
    const text = template(activeNote)
    setInput(text)
    textareaRef.current?.focus()
  }

  const handleVoiceTranscription = (text: string) => {
    const currentText = textareaRef.current?.value || ''
    const newText = currentText + (currentText ? '\n\n' : '') + text
    setInput(newText)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  return (
    <div className="flex-shrink-0 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
      {/* Quick prompts */}
      {activeNote && !isStreaming && (
        <div className="px-2 pt-2 flex gap-1 flex-wrap">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.id}
              onClick={() => handleQuickPrompt(qp.template as (note: typeof activeNote) => string)}
              className="text-[10px] px-2 py-1 rounded-full border transition-colors hover:border-accent"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
                background: 'var(--bg-elevated)'
              }}
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-2 flex gap-2 items-end">
        <VoiceInput onTranscriptionComplete={handleVoiceTranscription} />
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none border selectable"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            minHeight: 40,
            maxHeight: 120,
            fontFamily: 'var(--font-sans)'
          }}
          placeholder={hasProvider ? (activeNote ? '向费曼 AI 提问...' : '请先选择一篇笔记') : '请在设置中配置 AI'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!hasProvider || !activeNote}
          rows={1}
        />
        <button
          onClick={isStreaming ? abort : handleSend}
          disabled={!hasProvider || (!isStreaming && (!input.trim() || !activeNote))}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
          style={{ background: 'var(--accent-primary)', color: '#fff' }}
        >
          {isStreaming ? <Square size={14} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}
