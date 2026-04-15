import React, { useRef, useEffect, useState } from 'react'
import { useStore } from '../../store'
import { StudentMessage } from './StudentMessage'
import { AnswerInput } from './AnswerInput'
import { ExpertReport } from './ExpertReport'
import { NodeDetail } from '../nodes/NodeDetail'
import { ChatHistoryList } from '../chat/ChatHistoryList'
import { X, Loader2, AlertTriangle, History, Bot, GraduationCap, Sparkles, FileText, MessageSquare } from 'lucide-react'
import type { KnowledgeNode } from '../../types/node.types'
import { useAI } from '../../hooks/useAI'
import { useNotes } from '../../hooks/useNotes'

interface StudentPanelProps {
  onSubmitAnswer: (answer: string) => void
  onCancelVerification: () => void
  onStartVerification: (node: KnowledgeNode, explanation: string) => void
}

type ProviderRole = 'student' | 'expert'
type AssistantMode = 'chat' | 'edit-note'
type BusyAction = null | 'summary' | 'edit-note'
type LocalNotice = { type: 'error' | 'success'; text: string } | null

export function StudentPanel({ onSubmitAnswer, onCancelVerification, onStartVerification }: StudentPanelProps) {
  const {
    activeSession,
    isExpertAnalyzing,
    isStudentTyping,
    messages,
    toggleStudentPanel,
    activeNodes,
    selectedNodeId,
    setSelectedNode,
    settings,
    activeNote
  } = useStore()

  const { updateContent } = useNotes()
  const {
    sendMessage: sendFreeChat,
    isStreaming,
    summarizeNodesByContext,
    editNoteByInstruction
  } = useAI()

  const scrollRef = useRef<HTMLDivElement>(null)

  const [showHistory, setShowHistory] = useState(false)
  const [inputMode, setInputMode] = useState<'answer' | 'chat'>('answer')
  const [providerRole, setProviderRole] = useState<ProviderRole>('student')
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('chat')
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const [notice, setNotice] = useState<LocalNotice>(null)

  const selectedNode = selectedNodeId ? activeNodes.find((n) => n.id === selectedNodeId) : null
  const hasAIProvider = settings.aiProviders.length > 0
  const isVerifying = !!activeSession && activeSession.phase !== 'completed'
  const isWaitingForAnswer = isVerifying && !isStudentTyping && !isExpertAnalyzing

  const defaultProvider = settings.aiProviders.find((p) => p.isDefault) ?? settings.aiProviders[0] ?? null
  const expertProvider =
    settings.aiProviders.find((p) => p.id === settings.expertProviderId) ??
    defaultProvider
  const studentProvider =
    settings.aiProviders.find((p) => p.id === settings.studentProviderId) ??
    defaultProvider

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activeSession?.studentMessages, selectedNodeId])

  useEffect(() => {
    if (isVerifying) {
      setInputMode('answer')
      setAssistantMode('chat')
    }
  }, [isVerifying, activeSession?.sessionId])

  useEffect(() => {
    if (!selectedNodeId) return
    setNotice(null)
  }, [selectedNodeId])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const showError = (text: string) => setNotice({ type: 'error', text })
  const showSuccess = (text: string) => setNotice({ type: 'success', text })

  const handleSummarizeNodes = async () => {
    if (!hasAIProvider) {
      showError('No AI provider configured yet.')
      return
    }
    if (!activeNote) {
      showError('Open a note first, then summarize nodes.')
      return
    }
    if (busyAction) return

    setNotice(null)
    setBusyAction('summary')
    try {
      const result = await summarizeNodesByContext(providerRole)
      if (!result) {
        showError('Summary generation failed. Please retry.')
        return
      }
      updateContent(result.partial)
      showSuccess(result.changeSummary || 'Cornell note updated from learning context.')
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Summary generation failed.')
    } finally {
      setBusyAction(null)
    }
  }

  const handleTerminalSubmit = async (text: string) => {
    setNotice(null)

    if (isVerifying && inputMode === 'answer') {
      onSubmitAnswer(text)
      return
    }

    if (selectedNode && (selectedNode.state === 'unverified' || selectedNode.state === 'failed') && !isVerifying) {
      if (!hasAIProvider) {
        showError('No AI provider configured. Configure provider/API key in settings first.')
        return
      }
      onStartVerification(selectedNode, text)
      return
    }

    if (!hasAIProvider) {
      showError('No AI provider configured. Configure provider/API key in settings first.')
      return
    }

    if (assistantMode === 'edit-note' && !isVerifying) {
      if (!activeNote) {
        showError('Open a note first, then use AI note editing.')
        return
      }
      if (busyAction) return

      setBusyAction('edit-note')
      try {
        const result = await editNoteByInstruction(text, providerRole)
        if (!result) {
          showError('AI note editing failed. Try a more specific instruction.')
          return
        }
        updateContent(result.partial)
        showSuccess(result.changeSummary || 'Notebook content updated.')
      } catch (error) {
        showError(error instanceof Error ? error.message : 'AI note editing failed.')
      } finally {
        setBusyAction(null)
      }
      return
    }

    const persona = providerRole === 'student' ? 'xiaofang' : 'default'
    await sendFreeChat(text, undefined, undefined, undefined, providerRole, persona)
  }

  const inputDisabled = isVerifying
    ? (inputMode === 'answer' ? !isWaitingForAnswer : isStreaming || !!busyAction)
    : (isStreaming || !!busyAction)

  const modeLabel = assistantMode === 'edit-note' ? 'Edit Note' : 'Free Chat'

  return (
    <div
      className="flex flex-col flex-shrink-0 border-l"
      style={{
        width: 'var(--ai-panel-width)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        background: 'var(--bg-surface)'
      }}
    >
      {/* Compact Header */}
      <div
        className="flex items-center justify-between px-3 h-9 border-b flex-shrink-0"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)'
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: 'var(--accent-primary)' }}
          />
          <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--primary-color)' }}>
            小方
          </span>
          {isVerifying && (
            <Loader2 size={10} className="animate-spin flex-shrink-0" style={{ color: 'var(--primary-color)' }} />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1 rounded transition-all hover:opacity-80"
            style={{ 
              background: showHistory ? 'rgba(0,0,0,0.3)' : 'transparent',
              color: showHistory ? 'var(--primary-color)' : 'var(--text-muted)'
            }}
            title="对话历史"
          >
            <History size={13} />
          </button>
          <button
            onClick={toggleStudentPanel}
            className="p-1 rounded text-muted hover:text-primary transition-all hover:opacity-80"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-3">
            <ChatHistoryList onSelect={() => setShowHistory(false)} />
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {!activeSession && (
              <div className="animate-fade-in">
                <StudentMessage
                  role="student"
                  content="先讲一个知识点给我听？我会挑最关键的疑问来追问你。"
                />
              </div>
            )}

            {!isVerifying && selectedNode && (
              <div
                className="my-4 rounded-xl overflow-hidden animate-fade-in"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                <div
                  className="px-3 py-1.5 text-[10px] font-medium tracking-wider border-b"
                  style={{
                    color: 'var(--text-muted)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                  }}
                >
                  Selected Node
                </div>
                <NodeDetail node={selectedNode} onRetry={(node) => setSelectedNode(node.id)} />
              </div>
            )}

            {(!activeSession || messages.length > 0) && messages.map((msg, i) => (
              <StudentMessage
                key={`free-${i}`}
                role={msg.role === 'user' ? 'user' : 'assistant'}
                content={msg.content}
                reasoning={msg.reasoning}
                isStreaming={
                  msg.isStreaming || (msg.role === 'assistant' && i === messages.length - 1 && isStreaming)
                }
              />
            ))}

            {activeSession?.studentMessages.map((msg, i) => (
              <StudentMessage
                key={`session-${i}`}
                role={msg.role}
                content={msg.content}
                isStreaming={
                  msg.role === 'student' &&
                  i === activeSession.studentMessages.length - 1 &&
                  isStudentTyping
                }
              />
            ))}

            {(isExpertAnalyzing || activeSession?.phase === 'test_generating') && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-xs animate-pulse"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,200,0,0.1)',
                  color: '#ffc800',
                }}
              >
                <Loader2 size={12} className="animate-spin" />
                <span className="font-medium">
                  {activeSession?.phase === 'test_generating' ? 'Generating boundary tests...' : 'Expert analyzing...'}
                </span>
              </div>
            )}

            {activeSession?.phase === 'student_solving' && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-xs animate-pulse"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--primary-color)',
                }}
              >
                <Loader2 size={12} className="animate-spin" />
                <span className="font-medium">Student AI is trying your test case...</span>
              </div>
            )}

            {activeSession?.expertResult && (
              <div className="mt-2 animate-fade-in">
                <ExpertReport feedback={activeSession.expertResult} compact />
              </div>
            )}

            {activeSession?.phase === 'completed' && (
              <div className="py-2">
                <button
                  className="w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:opacity-80"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onClick={onCancelVerification}
                >
                  Close Current Verification
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notice - Absolute Position */}
        {notice && (
          <div
            className="absolute bottom-24 left-3 right-3 text-xs px-3 py-2 rounded-xl shadow-lg flex items-start gap-2 animate-fade-in backdrop-blur-sm z-10"
            style={{
              background: notice.type === 'error'
                ? 'color-mix(in srgb, var(--danger), var(--bg-surface) 85%)'
                : 'color-mix(in srgb, var(--success), var(--bg-surface) 85%)',
              border: notice.type === 'error'
                ? '1px solid color-mix(in srgb, var(--danger), transparent 60%)'
                : '1px solid color-mix(in srgb, var(--success), transparent 60%)',
              color: notice.type === 'error' ? 'var(--danger)' : 'var(--success)',
            }}
          >
            {notice.type === 'error' ? (
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            ) : (
              <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}
      </div>

      {/* Bottom Input Area - Fixed, Clean Layout */}
      <div
        className="flex flex-col border-t px-3 pb-3 pt-2"
        style={{ 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          background: 'rgba(0,0,0,0.15)',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.3)'
        }}
      >
        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar">
          {isVerifying && (
            <div className="flex items-center gap-1">
              <button
                className="h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all hover:opacity-80"
                style={{
                  background: inputMode === 'answer' ? 'rgba(0,0,0,0.5)' : 'transparent',
                  color: inputMode === 'answer' ? 'var(--primary-color)' : 'var(--text-muted)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => setInputMode('answer')}
              >
                回答
              </button>
              <button
                className="h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all hover:opacity-80"
                style={{
                  background: inputMode === 'chat' ? 'rgba(0,0,0,0.3)' : 'transparent',
                  color: inputMode === 'chat' ? 'var(--primary-color)' : 'var(--text-muted)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => setInputMode('chat')}
              >
                闲聊
              </button>
            </div>
          )}

          {!isVerifying && (
            <>
              <button
                className="h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all hover:opacity-80 whitespace-nowrap flex items-center gap-1.5"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: assistantMode === 'chat' ? 'rgba(0,0,0,0.3)' : 'transparent',
                  color: assistantMode === 'chat' ? 'var(--primary-color)' : 'var(--text-muted)'
                }}
                onClick={() => setAssistantMode('chat')}
              >
                <MessageSquare size={12} />
                对话
              </button>
              <button
                className="h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all hover:opacity-80 whitespace-nowrap flex items-center gap-1.5"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: assistantMode === 'edit-note' ? 'rgba(0,0,0,0.3)' : 'transparent',
                  color: assistantMode === 'edit-note' ? 'var(--primary-color)' : 'var(--text-muted)'
                }}
                onClick={() => setAssistantMode('edit-note')}
              >
                <FileText size={12} />
                编辑
              </button>
              <button
                className="h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all hover:opacity-80 whitespace-nowrap flex items-center gap-1.5 disabled:opacity-40"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'var(--text-muted)'
                }}
                onClick={() => void handleSummarizeNodes()}
                disabled={!hasAIProvider || !!busyAction}
                title="AI 总结到笔记"
              >
                <Sparkles size={12} />
              </button>
            </>
          )}
          
          <div className="flex-1" />
          
          {/* Provider Switch */}
          <div
            className="h-7 px-2 rounded-lg text-[11px] flex items-center gap-1.5 border"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: 'var(--text-primary)'
            }}
          >
            {providerRole === 'expert' ? <Bot size={11} /> : <GraduationCap size={11} />}
            <select
              value={providerRole}
              onChange={(event) => setProviderRole(event.target.value as ProviderRole)}
              className="terminal-select bg-transparent text-[11px] font-medium outline-none cursor-pointer"
              style={{ color: 'var(--primary-color)' }}
            >
              <option value="student">学生</option>
              <option value="expert">专家</option>
            </select>
          </div>
        </div>

        {/* Input */}
        <AnswerInput
          onSubmit={(text) => void handleTerminalSubmit(text)}
          onCancel={onCancelVerification}
          disabled={inputDisabled}
          placeholder={
            isVerifying
              ? (
                  inputMode === 'answer'
                    ? (isWaitingForAnswer ? '回答问题...' : '等待下一步...')
                    : '自由对话...'
                )
              : selectedNode && (selectedNode.state === 'unverified' || selectedNode.state === 'failed')
                ? `解释"${selectedNode.label}"...`
                : assistantMode === 'edit-note'
                  ? '描述如何编辑...'
                  : '输入消息...'
          }
        />

        {/* Hint Text */}
        <div className="mt-2 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-disabled)' }}>
          <div className="flex items-center gap-2">
            {busyAction && (
              <span className="flex items-center gap-1">
                <Loader2 size={9} className="animate-spin" />
                {busyAction === 'summary' ? '总结中...' : '编辑中...'}
              </span>
            )}
          </div>
          <span>Enter 发送 · Shift+Enter 换行</span>
        </div>
      </div>
    </div>
  )
}
