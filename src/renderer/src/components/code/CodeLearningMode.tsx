import React, { useState, useRef } from 'react'
import { useStore } from '../../store'
import { useAI } from '../../hooks/useAI'
import type { CodeFile } from '../../types/code-teaching.types'
import { LANGUAGE_CONFIGS, type ProgrammingLanguage } from '../../types/code-teaching.types'
import { 
  Send, 
  Bot, 
  ChevronDown,
  GraduationCap,
  Users,
  Briefcase,
  FileCode,
  Terminal,
  History,
  Clock
} from 'lucide-react'
import { VoiceInputSimple } from '../audio/VoiceInputSimple'
import { StudentMessage } from '../student/StudentMessage'
import { ChatHistoryList } from '../chat/ChatHistoryList'
import { CppVersionHistory } from '../cpp/CppVersionHistory'
import { NoteMentionPopover } from '../cpp/NoteMentionPopover'
import { FileText, X as CloseIcon, Plus } from 'lucide-react'
import type { NoteMetadata } from '../../types'

type XiaoFangRole = 'beginner' | 'partner' | 'interviewer' | 'expert'

const ROLES: { id: XiaoFangRole; name: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'beginner', name: '困惑新手', icon: <GraduationCap size={14} />, desc: '追问为什么' },
  { id: 'partner', name: '学习伙伴', icon: <Users size={14} />, desc: '一起讨论' },
  { id: 'interviewer', name: '面试官', icon: <Briefcase size={14} />, desc: '出题考核' },
  { id: 'expert', name: '专家求助', icon: <Bot size={14} className="text-yellow-400" />, desc: '导师手把手教' },
]

/**
 * CodeLearningMode - 编程语言费曼学习模式
 * 
 * 支持多种编程语言的学习模式
 */
export function CodeLearningMode() {
  const { 
    cppFiles, 
    activeCppFileId, 
    updateCppFile,
    createSession,
    currentLanguage
  } = useStore()

  const { messages, isStreaming, sendMessage, hasProvider } = useAI()
  
  const [inputText, setInputText] = useState('')
  const [role, setRole] = useState<XiaoFangRole>('beginner')
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showCodeHistory, setShowCodeHistory] = useState(false)
  const [showMentionPopover, setShowMentionPopover] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [attachedNotes, setAttachedNotes] = useState<NoteMetadata[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  const activeFile = cppFiles.find((f: CodeFile) => f.id === activeCppFileId)
  const code = activeFile?.code || ''
  
  const langConfig = currentLanguage ? LANGUAGE_CONFIGS[currentLanguage] : LANGUAGE_CONFIGS.cpp
  
  const setCode = (newCode: string) => {
    if (activeCppFileId) {
      updateCppFile(activeCppFileId, { code: newCode })
    }
  }

  const currentRole = ROLES.find(r => r.id === role)!

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return
    const msg = inputText.trim()
    setInputText('')
    
    const fullMsg = code 
      ? `${msg}\n\n[代码]\n\`\`\`${currentLanguage || 'cpp'}\n${code}\n\`\`\``
      : msg
    
    const levelMap: Record<XiaoFangRole, 'beginner' | 'intermediate' | 'advanced'> = {
      beginner: 'beginner',
      partner: 'intermediate',
      interviewer: 'advanced',
      expert: 'advanced'
    }
    const providerRole = role === 'expert' ? 'expert' : 'student'

    await sendMessage(
      fullMsg, 
      attachedNotes.map(n => n.id),
      role,
      levelMap[role],
      providerRole
    )
    setAttachedNotes([])
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const lines = code.split('\n')

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-gray-300">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700/50">
        <div className="flex items-center gap-2" style={{ color: langConfig.color }}>
          <FileCode size={18} />
          <span className="font-semibold">{langConfig.displayName} 费曼学习模式</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCodeHistory(!showCodeHistory)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider transition-all ${
              showCodeHistory ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock size={12} />
            神经网络历史
          </button>
        </div>
      </div>

      {/* 双栏 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左：代码区 */}
        <div className="flex-1 flex flex-col border-r border-gray-700/50">
          <div className="px-3 py-2 bg-[#161b22] border-b border-gray-700/50">
            <span className="text-xs text-gray-500">代码</span>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* 行号 */}
            <div className="w-10 text-right pr-2 pt-4 text-xs text-gray-600 select-none font-mono">
              {lines.map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
            </div>
            
            {/* 输入 */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent text-gray-300 font-mono text-sm leading-6 resize-none outline-none p-4 pl-1"
              spellCheck={false}
              placeholder={`在这里输入你的 ${langConfig.displayName} 代码...`}
            />
          </div>
        </div>

        {/* 版本历史面板 */}
        {showCodeHistory && activeCppFileId && (
          <CppVersionHistory 
            fileId={activeCppFileId} 
            onClose={() => setShowCodeHistory(false)} 
          />
        )}

        {/* 右：对话区 */}
        <div className="w-[380px] flex flex-col">
          {/* 标题 */}
          <div className="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-base ${
                  role === 'expert' 
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                    : ''
                }`}
                style={role !== 'expert' ? { background: langConfig.gradient } : undefined}
              >
                {role === 'expert' ? '👨‍🏫' : langConfig.icon}
              </div>
              <div>
                <div className={`text-sm font-medium ${role === 'expert' ? 'text-yellow-400' : ''}`}>
                  {role === 'expert' ? '专家导师' : '小方'}
                </div>
                <div className="text-xs text-gray-500">{currentRole.desc}</div>
              </div>
            </div>
            
            {/* 角色切换与历史按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  createSession(null, '新对话')
                  setAttachedNotes([])
                }}
                className={`p-1.5 rounded transition-colors text-gray-500 hover:text-gray-400 hover:bg-gray-700/30`}
                title="新建对话"
              >
                <Plus size={14} />
              </button>

              <button
                onClick={() => setShowChatHistory(!showChatHistory)}
                className={`p-1.5 rounded transition-colors ${
                  showChatHistory ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-gray-400'
                }`}
                title="聊天历史"
              >
                <History size={14} />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 bg-gray-800/50 rounded"
                >
                  {currentRole.icon}
                  <span>{currentRole.name}</span>
                  <ChevronDown size={12} />
                </button>
                
                {showRoleMenu && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-[#1c2128] border border-gray-700/50 rounded-lg shadow-lg z-10">
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setRole(r.id); setShowRoleMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${
                          r.id === role ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700/50'
                        } first:rounded-t-lg last:rounded-b-lg`}
                      >
                        {r.icon}
                        <span>{r.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 消息 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {showChatHistory ? (
              <ChatHistoryList onSelect={() => setShowChatHistory(false)} />
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl"
                  style={{ background: `${langConfig.color}20` }}
                >
                  {langConfig.icon}
                </div>
                <p className="text-sm">向小方解释你的 {langConfig.displayName} 代码</p>
              </div>
            ) : (
              messages.map((msg) => (
                <StudentMessage
                  key={msg.id}
                  role={msg.role === 'user' ? 'user' : 'assistant'}
                  content={msg.content}
                  reasoning={msg.reasoning}
                  isStreaming={msg.isStreaming}
                />
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 输入 */}
          <div className="p-3 border-t border-gray-700/50 relative">
            {/* Mention Popover */}
            {showMentionPopover && (
              <NoteMentionPopover 
                filter={mentionFilter} 
                onClose={() => setShowMentionPopover(false)}
                onSelect={(note) => {
                  if (!attachedNotes.find(n => n.id === note.id)) {
                    setAttachedNotes([...attachedNotes, note])
                  }
                  const newText = inputText.replace(/@@[^\s]*$/, '')
                  setInputText(newText)
                  setShowMentionPopover(false)
                }}
              />
            )}

            {/* Attached Notes Chips */}
            {attachedNotes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachedNotes.map(note => (
                  <div 
                    key={note.id} 
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-400"
                  >
                    <FileText size={10} />
                    <span>{note.title}</span>
                    <button 
                      onClick={() => setAttachedNotes(attachedNotes.filter(n => n.id !== note.id))}
                      className="hover:text-blue-200"
                    >
                      <CloseIcon size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  const val = e.target.value
                  setInputText(val)
                  
                  const mentionMatch = val.match(/@@([^\s]*)$/)
                  if (mentionMatch) {
                    setMentionFilter(mentionMatch[1])
                    setShowMentionPopover(true)
                  } else {
                    setShowMentionPopover(false)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !showMentionPopover) {
                    handleSend()
                  }
                }}
                placeholder={hasProvider ? "解释代码...（输入 @@ 关联笔记页面）" : "请先配置 AI"}
                disabled={!hasProvider || isStreaming}
                className="flex-1 bg-[#1c2128] border border-gray-700/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 disabled:opacity-50"
              />
              <div className="flex flex-col justify-end gap-1">
                <VoiceInputSimple onTranscriptionComplete={(text) => setInputText(v => v + (v ? ' ' : '') + text)} />
                <button
                  onClick={handleSend}
                  disabled={!hasProvider || isStreaming || !inputText.trim()}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部 */}
      <div 
        className="flex items-center justify-center px-4 py-1.5 text-white text-xs gap-2"
        style={{ background: langConfig.color }}
      >
        <Terminal size={12} />
        <span>{langConfig.displayName} 模式</span>
        <span className="text-white/60">|</span>
        <span>向小方讲解，暴露盲区</span>
      </div>
    </div>
  )
}
