import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store'
import { useAI } from '../../hooks/useAI'
import type { CodeFile } from '../../types/code-teaching.types'
import { LANGUAGE_CONFIGS, type ProgrammingLanguage } from '../../types/code-teaching.types'
import type { CodeReviewResult } from '../../types/code-review.types'
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
  Clock,
  Code2,
  Bug,
  X,
  AlertTriangle,
  Lightbulb,
  XCircle
} from 'lucide-react'
import { VoiceInputSimple } from '../audio/VoiceInputSimple'
import { StudentMessage } from '../student/StudentMessage'
import { ChatHistoryList } from '../chat/ChatHistoryList'
import { CppVersionHistory } from '../cpp/CppVersionHistory'
import { NoteMentionPopover } from '../cpp/NoteMentionPopover'
import { FileText, Plus } from 'lucide-react'
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
 * 支持多种编程语言的学习模式，包含 AI 代码纠错功能
 */
export function CodeLearningMode() {
  const { 
    cppFiles, 
    activeCppFileId, 
    updateCppFile,
    createSession,
    settings,
    currentLanguage,
    addCppFile,
    setActiveCppFileId
  } = useStore()
  
  // 检测当前主题
  const isDarkTheme = settings.appearance.theme === 'dark' || 
    (settings.appearance.theme === 'system' && 
     (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches))

  const { messages, isStreaming, sendMessage, hasProvider, reviewCode } = useAI()
  
  const [inputText, setInputText] = useState('')
  const [role, setRole] = useState<XiaoFangRole>('beginner')
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showCodeHistory, setShowCodeHistory] = useState(false)
  const [showMentionPopover, setShowMentionPopover] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [attachedNotes, setAttachedNotes] = useState<NoteMetadata[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // 代码纠错状态
  const [showCodeReview, setShowCodeReview] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null)

  // Auto-create a file if none exists when entering code mode
  useEffect(() => {
    if (cppFiles.length === 0) {
      const newId = addCppFile()
      // addCppFile already sets activeCppFileId
    } else if (!activeCppFileId) {
      setActiveCppFileId(cppFiles[0].id)
    }
  }, []) // Run once on mount

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

  // 代码纠错处理
  const handleCodeReview = async () => {
    if (!code.trim() || !hasProvider) return
    
    setIsReviewing(true)
    setShowCodeReview(true)
    setReviewResult(null)
    
    try {
      const result = await reviewCode(code, currentLanguage || 'cpp')
      setReviewResult(result)
    } catch (error) {
      setReviewResult({
        overallAssessment: `代码审查失败：${error instanceof Error ? error.message : String(error)}`,
        score: 0,
        fixes: [],
        optimizationTips: ['请检查网络连接和 API 配置。']
      })
    } finally {
      setIsReviewing(false)
    }
  }

  // 应用修正
  const handleApplyFix = (fixedCode: string) => {
    setCode(fixedCode)
    setShowCodeReview(false)
    setReviewResult(null)
  }

  const lines = code.split('\n')

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-gray-300">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700/50">
        <div className="flex items-center gap-2 text-[var(--primary-color)]">
          <FileCode size={18} />
          <span className="font-semibold">{langConfig.displayName} 费曼学习模式</span>
        </div>
        <div className="flex items-center gap-3">
          {/* AI 代码纠错按钮 */}
          <button
            data-tutorial="code-review"
            onClick={handleCodeReview}
            disabled={!hasProvider || isReviewing || !code.trim()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider transition-all ${
              showCodeReview 
                ? 'bg-yellow-500 text-black' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="AI 代码纠错"
          >
            <Bug size={12} />
            {isReviewing ? '分析中...' : 'AI 纠错'}
          </button>
          
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
        <div 
          className="flex-1 flex flex-col border-r border-gray-700/50"
          style={{ backgroundColor: isDarkTheme ? '#0d1117' : '#ffffff' }}
        >
          <div 
            className="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between"
            style={{ backgroundColor: isDarkTheme ? '#161b22' : '#f8f9fa' }}
          >
            <span className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>
              {showCodeReview && reviewResult ? '代码差异视图' : '代码'}
            </span>
            {showCodeReview && reviewResult && reviewResult.fixedCode && (
              <button
                onClick={() => {
                  setCode(reviewResult.fixedCode!)
                  setShowCodeReview(false)
                  setReviewResult(null)
                }}
                className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
              >
                应用全部修正
              </button>
            )}
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* 差异视图模式 */}
            {showCodeReview && reviewResult ? (
              <div className="flex-1 overflow-auto font-mono text-sm">
                {(() => {
                  const originalLines = code.split('\n')
                  const fixMap = new Map<number, typeof reviewResult.fixes[0]>()
                  for (const fix of reviewResult.fixes) {
                    fixMap.set(fix.lineNumber, fix)
                  }
                  
                  const resultLines: React.ReactNode[] = []
                  
                  for (let i = 0; i < originalLines.length; i++) {
                    const lineNum = i + 1
                    const originalLine = originalLines[i]
                    const fix = fixMap.get(lineNum)
                    
                    if (fix) {
                      // 红色高亮显示原代码（删除线）
                      resultLines.push(
                        <div key={`del-${lineNum}`} className="flex bg-red-500/10 border-l-2 border-red-500">
                          <div className="w-10 text-right pr-2 pt-1 text-xs text-red-400 select-none">
                            {lineNum}
                          </div>
                          <div className={`flex-1 pl-2 py-1 text-red-300 line-through`}>
                            {originalLine || ' '}
                          </div>
                        </div>
                      )
                      
                      // 绿色高亮显示修正代码
                      resultLines.push(
                        <div key={`add-${lineNum}`} className="flex bg-green-500/10 border-l-2 border-green-500">
                          <div className="w-10 text-right pr-2 pt-1 text-xs text-green-400 select-none">
                            <span className="text-[10px]">修正</span>
                          </div>
                          <div className={`flex-1 pl-2 py-1 ${isDarkTheme ? 'text-green-300' : 'text-green-700'}`}>
                            {fix.fixedLine || ' '}
                          </div>
                        </div>
                      )
                      
                      // 注释说明修正理由
                      resultLines.push(
                        <div 
                          key={`comment-${lineNum}`} 
                          className={`flex border-l-2 border-gray-600 ${isDarkTheme ? 'bg-gray-800/30' : 'bg-gray-100'}`}
                        >
                          <div className="w-10 text-right pr-2 pt-1 select-none">
                            {fix.type === 'error' && <XCircle size={12} className="inline text-red-400" />}
                            {fix.type === 'warning' && <AlertTriangle size={12} className="inline text-yellow-400" />}
                            {fix.type === 'suggestion' && <Lightbulb size={12} className="inline text-blue-400" />}
                          </div>
                          <div className={`flex-1 pl-2 py-1 text-xs italic ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                            // {fix.reason}
                          </div>
                        </div>
                      )
                    } else {
                      // 未修改的行
                      resultLines.push(
                        <div 
                          key={`line-${lineNum}`} 
                          className={`flex ${isDarkTheme ? 'hover:bg-gray-800/30' : 'hover:bg-gray-100'}`}
                        >
                          <div className={`w-10 text-right pr-2 pt-1 text-xs select-none ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                            {lineNum}
                          </div>
                          <div className={`flex-1 pl-2 py-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                            {originalLine || ' '}
                          </div>
                        </div>
                      )
                    }
                  }
                  
                  return resultLines
                })()}
              </div>
            ) : (
              <>
                {/* 行号 */}
                <div className={`w-10 text-right pr-2 pt-4 text-xs select-none font-mono ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                  {lines.map((_, i) => (
                    <div key={i} className="leading-6">{i + 1}</div>
                  ))}
                </div>
                
                {/* 输入 */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`flex-1 bg-transparent font-mono text-sm leading-6 resize-none outline-none p-4 pl-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}
                  spellCheck={false}
                  placeholder={`在这里输入你的 ${langConfig.displayName} 代码...`}
                />
              </>
            )}
          </div>
        </div>

        {/* 版本历史面板 */}
        {showCodeHistory && activeCppFileId && (
          <CppVersionHistory 
            fileId={activeCppFileId} 
            onClose={() => setShowCodeHistory(false)} 
          />
        )}

        {/* 代码纠错面板 */}
        {showCodeReview && (
          <div 
            className="w-[600px] flex flex-col border-l border-gray-700/50"
            style={{ backgroundColor: isDarkTheme ? '#0d1117' : '#ffffff' }}
          >
            <div 
              className="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between"
              style={{ backgroundColor: isDarkTheme ? '#161b22' : '#f8f9fa' }}
            >
              <div className="flex items-center gap-2 text-yellow-400">
                <Bug size={16} />
                <span className="text-sm font-semibold">AI 代码纠错</span>
              </div>
              <button
                onClick={() => {
                  setShowCodeReview(false)
                  setReviewResult(null)
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {isReviewing ? (
                <div className={`flex flex-col items-center justify-center h-full ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mb-3" />
                  <p className="text-sm">AI 正在分析你的代码...</p>
                </div>
              ) : reviewResult ? (
                <div className="space-y-4">
                  {/* 评分 */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkTheme ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <div className={`text-3xl font-bold ${
                      reviewResult.score >= 80 ? 'text-green-400' :
                      reviewResult.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {reviewResult.score}
                    </div>
                    <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className={`font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>代码质量评分</div>
                      <div className="text-xs">
                        {reviewResult.score >= 80 ? '优秀！代码质量很高' :
                         reviewResult.score >= 60 ? '良好，但还有改进空间' : '需要改进'}
                      </div>
                    </div>
                  </div>
                  
                  {/* 总体评价 */}
                  <div>
                    <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>总体评价</h3>
                    <p className={`text-sm p-3 rounded-lg ${isDarkTheme ? 'text-gray-400 bg-gray-800/30' : 'text-gray-600 bg-gray-100'}`}>
                      {reviewResult.overallAssessment}
                    </p>
                  </div>
                  
                  {/* 代码修正提示 */}
                  {reviewResult.fixes.length > 0 && (
                    <div>
                      <h3 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                        <AlertTriangle size={14} className="text-yellow-400" />
                        发现 {reviewResult.fixes.length} 处问题
                      </h3>
                      <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                        请在左侧代码区查看差异，红色为原代码，绿色为修正内容
                      </p>
                    </div>
                  )}
                  
                  {/* 优化建议 */}
                  {reviewResult.optimizationTips.length > 0 && (
                    <div>
                      <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>优化建议</h3>
                      <ul className="space-y-2">
                        {reviewResult.optimizationTips.map((tip, i) => (
                          <li key={i} className={`flex gap-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="text-blue-400">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bug size={32} className="mb-3 opacity-50" />
                  <p className="text-sm">点击"AI 纠错"开始分析</p>
                </div>
              )}
            </div>
          </div>
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
                  style={{ background: 'color-mix(in srgb, var(--primary-color), transparent 88%)' }}
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
        style={{ background: 'var(--primary-color)' }}
      >
        <Terminal size={12} />
        <span>{langConfig.displayName} 模式</span>
        <span className="text-white/60">|</span>
        <span>向小方讲解，暴露盲区</span>
      </div>
    </div>
  )
}
