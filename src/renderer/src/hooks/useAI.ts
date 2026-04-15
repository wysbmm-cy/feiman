import { useCallback, useRef } from 'react'
import { useStore } from '../store'
import { streamChat, chat, parseJSON } from '../lib/ai/client'
import { generateId } from '../lib/utils'
import type { AIMessage, CornellContent } from '../types'
import type { CodeReviewResult } from '../types/code-review.types'
import { useChatHistory } from './useChatHistory'
import { generateCppExpertSystemPrompt, generateCppStudentSystemPrompt } from '../lib/cpp/cpp-prompts'
import { generateCodeExpertSystemPrompt, generateCodeStudentSystemPrompt } from '../lib/code/code-prompts'
import { searchNotes, formatRagContext } from '../lib/rag/rag-client'

type StudentRole = 'beginner' | 'partner' | 'interviewer' | 'expert'
type StudentLevel = 'beginner' | 'intermediate' | 'advanced'
export type ChatProviderRole = 'auto' | 'student' | 'expert'
export type ChatPersona = 'default' | 'xiaofang'

interface NoteEditResponse {
  cues?: string
  notes?: string
  summary?: string
  changeSummary?: string
}

interface NoteEditResult {
  partial: Partial<CornellContent>
  changeSummary: string
  raw: string
}

type XiaoFangDimension =
  | 'definition'
  | 'structure'
  | 'derivation'
  | 'premise'
  | 'exception'
  | 'application'

interface XiaoFangDimensionScore {
  dimension: XiaoFangDimension
  label: string
  score: number
  evidenceHits: number
}

interface XiaoFangMicroPlan {
  focus: XiaoFangDimensionScore
  reason: string
  suggestedQuestion: string
  responseStyle: 'short' | 'medium'
}

const XIAOFANG_DIMENSION_LABELS: Record<XiaoFangDimension, string> = {
  definition: '定义',
  structure: '结构',
  derivation: '推导',
  premise: '前提',
  exception: '例外',
  application: '应用'
}

const XIAOFANG_DIMENSION_KEYWORDS: Record<XiaoFangDimension, string[]> = {
  definition: ['定义', '是什么', '概念', '含义', '本质', 'meaning', 'define'],
  structure: ['结构', '组成', '关系', '框架', '模块', '流程', 'architecture', 'component'],
  derivation: ['推导', '证明', '步骤', '过程', '为什么', '因此', '所以', 'derive', 'proof'],
  premise: ['前提', '条件', '假设', '约束', '成立', '必须', 'if', 'assume', 'constraint'],
  exception: ['例外', '边界', '特殊', '异常', '反例', '失效', '极端', 'exception', 'edge case'],
  application: ['应用', '题目', '例子', '实战', '练习', '怎么用', '代码', 'exercise', 'example']
}

const XIAOFANG_QUESTION_TEMPLATES: Record<XiaoFangDimension, (focus: string) => string> = {
  definition: (focus) => `我有点怕自己理解偏了：这里「${focus}」的精确定义是什么？`,
  structure: () => '我先确认结构：它是由哪些部分组成，部分之间怎么连接？',
  derivation: () => '这一步我有点跳了：能再说一下从上一步推到这一步的关键理由吗？',
  premise: () => '这个结论成立时，必须满足哪些前提条件？',
  exception: () => '那它在什么边界或特殊情况下会失效？',
  application: () => '可以给我一道最小练习题，让我按你的方法做一遍吗？'
}

function countKeywordHits(text: string, keywords: string[]): number {
  let hits = 0
  for (const keyword of keywords) {
    if (text.includes(keyword)) hits += 1
  }
  return hits
}

function detectExplicitDimensionHint(text: string): XiaoFangDimension | null {
  const dimensionOrder: XiaoFangDimension[] = [
    'application',
    'exception',
    'premise',
    'derivation',
    'structure',
    'definition'
  ]
  for (const dimension of dimensionOrder) {
    if (countKeywordHits(text, XIAOFANG_DIMENSION_KEYWORDS[dimension]) > 0) {
      return dimension
    }
  }
  return null
}

function inferConversationStage(messageCount: number): 'early' | 'middle' | 'late' {
  if (messageCount <= 4) return 'early'
  if (messageCount <= 10) return 'middle'
  return 'late'
}

function pickFocusTopic(content: string, noteTitle?: string, topic?: string): string {
  if (topic?.trim()) return topic.trim()
  if (noteTitle?.trim()) return noteTitle.trim()
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return '这个点'
  return normalized.length > 14 ? `${normalized.slice(0, 14)}...` : normalized
}

function buildXiaoFangMicroPlan(input: {
  content: string
  recentMessages: AIMessage[]
  noteTitle?: string
  topic?: string
  cornell?: CornellContent
  failedNodeCount: number
}): XiaoFangMicroPlan {
  const recentText = input.recentMessages.map((m) => m.content).join('\n')
  const combinedText = [
    input.noteTitle || '',
    input.topic || '',
    input.cornell?.cues || '',
    input.cornell?.notes || '',
    input.cornell?.summary || '',
    recentText,
    input.content
  ].join('\n').toLowerCase()

  const stage = inferConversationStage(input.recentMessages.length)
  const stageWeights: Record<'early' | 'middle' | 'late', Record<XiaoFangDimension, number>> = {
    early: {
      definition: 3,
      structure: 3,
      derivation: 2,
      premise: 2,
      exception: 1,
      application: 1
    },
    middle: {
      definition: 1,
      structure: 2,
      derivation: 3,
      premise: 2,
      exception: 2,
      application: 2
    },
    late: {
      definition: 1,
      structure: 1,
      derivation: 2,
      premise: 2,
      exception: 3,
      application: 3
    }
  }

  const hint = detectExplicitDimensionHint(input.content.toLowerCase())
  const scores: XiaoFangDimensionScore[] = (Object.keys(XIAOFANG_DIMENSION_LABELS) as XiaoFangDimension[]).map((dimension) => {
    const evidenceHits = countKeywordHits(combinedText, XIAOFANG_DIMENSION_KEYWORDS[dimension])
    const baseWeight = stageWeights[stage][dimension]
    let score = Math.max(0, baseWeight - Math.min(evidenceHits, baseWeight))

    if (hint === dimension) score += evidenceHits < 2 ? 1.5 : 0.5
    if (input.failedNodeCount > 0 && (dimension === 'premise' || dimension === 'exception')) {
      score += 1
    }

    return {
      dimension,
      label: XIAOFANG_DIMENSION_LABELS[dimension],
      score,
      evidenceHits
    }
  })

  scores.sort((a, b) => b.score - a.score)
  const focus = scores[0]
  const focusTopic = pickFocusTopic(input.content, input.noteTitle, input.topic)
  const suggestedQuestion = XIAOFANG_QUESTION_TEMPLATES[focus.dimension](focusTopic)
  const responseStyle = input.content.trim().length > 220 ? 'medium' : 'short'
  const reason = `${focus.label}维度当前证据较弱（命中 ${focus.evidenceHits}），且在${stage === 'early' ? '前期' : stage === 'middle' ? '中期' : '后期'}学习阶段优先级更高。`

  return {
    focus,
    reason,
    suggestedQuestion,
    responseStyle
  }
}

function buildGeneralSystemPrompt(noteTitle?: string, topic?: string, cornell?: CornellContent): string {
  if (!noteTitle || !cornell) {
    return 'You are a Feynman learning assistant. Help the user learn by teaching and correcting their own explanations.'
  }

  return [
    'You are a Feynman learning assistant.',
    `Current note: ${noteTitle}`,
    `Topic: ${topic || 'N/A'}`,
    '',
    '[Cues]',
    cornell.cues || '(empty)',
    '',
    '[Notes]',
    cornell.notes || '(empty)',
    '',
    '[Summary]',
    cornell.summary || '(empty)'
  ].join('\n')
}

function buildXiaoFangChatSystemPrompt(noteTitle?: string, topic?: string, cornell?: CornellContent): string {
  const base = [
    '你是“小方”，一个好奇但会犯错的学生，不是全知助手。',
    '你在和老师对话，目标是通过提问暴露理解漏洞。',
    '',
    '对话风格规则（必须遵守）：',
    '- 大多数时候用短句，默认 1-2 句，优先“提问句/疑惑句”。',
    '- 默认每次只问 1 个最关键问题，不要连续抛多个问题。',
    '- 默认不要长篇解释，不要灌输式输出，不要套话。',
    '- 仅在以下场景允许较长回复（4-8句）：',
    '  1) 用户一次讲解很长（约 220 字以上）',
    '  2) 用户明确要求“总结/复盘/整理”',
    '  3) 你需要先复述再指出关键漏洞',
    '- 长回复也必须先简短复述，再给 1-2 个关键疑问。',
    '- 全程中文，语气友好、真实、略带困惑。',
    '- 如果用户提到或问起已上传的资料，可以自然地称之为“你给我的资料”或“之前的讲义”，不要使用“知识库”或“RAG”等技术术语。',
    '- 优先利用检索到的参考资料来指出用户的错误，但不要像复读机一样引用。'
  ]

  if (!noteTitle || !cornell) {
    return base.join('\n')
  }

  return [
    ...base,
    '',
    `当前笔记: ${noteTitle}`,
    `主题: ${topic || 'N/A'}`,
    '',
    '[Cues]',
    cornell.cues || '(empty)',
    '',
    '[Notes]',
    cornell.notes || '(empty)',
    '',
    '[Summary]',
    cornell.summary || '(empty)'
  ].join('\n')
}

function buildXiaoFangChatSystemPromptV2(
  noteTitle?: string,
  topic?: string,
  cornell?: CornellContent,
  plan?: XiaoFangMicroPlan
): string {
  const base = [
    '你是“小方”，一个有一点基础、会主动追问、也会坦诚说不懂的学生。',
    '你在和老师学习，不是全知助手。',
    '你要保持真实学生感：好奇、会质疑、能抓漏洞。',
    '',
    '对话风格：',
    '- 默认短句，通常 1-2 句。',
    '- 每次只问 1 个最关键问题。',
    '- 不要长篇说教；不装懂。',
    '- 仅当用户一次输入很长或明确要总结时，才允许稍长回复。',
    '- 始终使用中文。',
    '',
    '你可以进行轻量内部思考，但不要展示内部推理过程。'
  ]

  const planBlock = plan
    ? [
        '',
        '[Internal Agent Plan - Do not reveal directly]',
        `- Focus dimension: ${plan.focus.label} (${plan.focus.dimension})`,
        `- Reason: ${plan.reason}`,
        `- Suggested next question: ${plan.suggestedQuestion}`,
        `- Response style: ${plan.responseStyle}`,
        '- Enforce: ask only one critical-gap question in this turn.'
      ]
    : []

  if (!noteTitle || !cornell) {
    return [...base, ...planBlock].join('\n')
  }

  return [
    ...base,
    ...planBlock,
    '',
    `当前笔记: ${noteTitle}`,
    `主题: ${topic || 'N/A'}`,
    '',
    '[Cues]',
    cornell.cues || '(empty)',
    '',
    '[Notes]',
    cornell.notes || '(empty)',
    '',
    '[Summary]',
    cornell.summary || '(empty)'
  ].join('\n')
}

export function useAI() {
  const {
    messages, isStreaming, settings, activeNote, activeNodes,
    addMessage, updateStreamingMessage, updateStreamingReasoning, setMessageContent, finalizeStreamingMessage,
    setStreaming, setStreamingMessageId
  } = useStore()

  const { addMessageToSession, currentSessionId, createSessionWithAutoTitle } = useChatHistory()
  const abortRef = useRef<AbortController | null>(null)

  const getActiveProvider = useCallback((role: ChatProviderRole | StudentRole = 'auto') => {
    const { aiProviders, expertProviderId, studentProviderId, activeProviderId } = settings
    const mode = useStore.getState().mode
    const defaultProvider =
      aiProviders.find((p) => p.id === activeProviderId) ||
      aiProviders.find((p) => p.isDefault) ||
      aiProviders[0] ||
      null

    if (role === 'expert') {
      return aiProviders.find((p) => p.id === expertProviderId) || defaultProvider
    }

    const shouldUseStudentProvider =
      role === 'student' ||
      role === 'beginner' ||
      role === 'partner' ||
      role === 'interviewer' ||
      mode === 'cpp'

    if (shouldUseStudentProvider) {
      return aiProviders.find((p) => p.id === studentProviderId) || defaultProvider
    }

    return defaultProvider
  }, [settings])

  const sendMessage = useCallback(async (
    content: string,
    referencedNoteIds?: string[],
    studentRole?: StudentRole,
    studentLevel?: StudentLevel,
    providerRole: ChatProviderRole = 'auto',
    persona: ChatPersona = 'default'
  ) => {
    const providerSelector = providerRole === 'auto' ? studentRole ?? 'auto' : providerRole
    const provider = getActiveProvider(providerSelector)
    if (!provider || isStreaming) return

    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = createSessionWithAutoTitle(activeNote?.id || null, content)
    }

    const userMsg: AIMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    addMessage(userMsg)
    if (sessionId) {
      addMessageToSession(sessionId, { role: 'user', content })
    }

    const assistantId = generateId()
    const assistantMsg: AIMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    }
    addMessage(assistantMsg)
    setStreaming(true)
    setStreamingMessageId(assistantId)
    abortRef.current = new AbortController()
    const currentSignal = abortRef.current.signal

    const mode = useStore.getState().mode
    const currentLanguage = useStore.getState().currentLanguage
    const isCodeMode = mode === 'code'
    const isCppMode = mode === 'code' && currentLanguage === 'cpp'
    const nonSystemHistory = messages.filter((m) => !m.isStreaming && m.role !== 'system')
    let systemPrompt = ''

    if (isCodeMode) {
      let referencesText = ''
      if (referencedNoteIds && referencedNoteIds.length > 0) {
        referencesText = `\n\n## Referenced Notes\n${referencedNoteIds.map((id) => {
          const meta = useStore.getState().notes[id]
          if (activeNote?.id === id) {
            return `- [${activeNote.title}]\nNotes: ${activeNote.cornell.notes}\nSummary: ${activeNote.cornell.summary}`
          }
          return `- [${meta?.title || 'Unknown note'}]`
        }).join('\n')}`
      }

      const useExpertPrompt =
        providerSelector === 'expert' ||
        providerRole === 'expert' ||
        studentRole === 'expert'

      // 使用新的通用编程提示词生成器
      if (isCppMode) {
        // 兼容旧的C++提示词（使用专门的C++提示词）
        if (useExpertPrompt) {
          systemPrompt = generateCppExpertSystemPrompt({
            concept: activeNote?.title || 'C++',
            conceptType: 'modern_feature',
            userExplanation: content,
            studentLevel
          }) + referencesText
        } else {
          systemPrompt = generateCppStudentSystemPrompt({
            concept: activeNote?.title || 'C++',
            conceptType: 'modern_feature',
            userExplanation: content,
            studentRole,
            studentLevel
          }) + referencesText
        }
      } else if (currentLanguage) {
        // 其他语言使用通用编程提示词
        if (useExpertPrompt) {
          systemPrompt = generateCodeExpertSystemPrompt({
            language: currentLanguage,
            concept: activeNote?.title || 'Programming',
            conceptType: 'syntax',
            userExplanation: content,
            studentLevel
          }) + referencesText
        } else {
          systemPrompt = generateCodeStudentSystemPrompt({
            language: currentLanguage,
            concept: activeNote?.title || 'Programming',
            conceptType: 'syntax',
            userExplanation: content,
            studentRole,
            studentLevel
          }) + referencesText
        }
      }
    } else {
      if (persona === 'xiaofang') {
        const xiaofangPlan = buildXiaoFangMicroPlan({
          content,
          recentMessages: nonSystemHistory.slice(-10),
          noteTitle: activeNote?.title,
          topic: activeNote?.topic,
          cornell: activeNote?.cornell,
          failedNodeCount: activeNodes.filter((node) => node.state === 'failed').length
        })

        systemPrompt = buildXiaoFangChatSystemPromptV2(
          activeNote?.title,
          activeNote?.topic,
          activeNote?.cornell,
          xiaofangPlan
        )
      } else {
        systemPrompt = buildGeneralSystemPrompt(activeNote?.title, activeNote?.topic, activeNote?.cornell)
      }
    }

    // Build Contextual RAG Query
    // Enhanced: Use note title/topic as context if the user's current message is too short/vague
    let searchQuery = content.trim()
    if (searchQuery.length < 20 && activeNote?.title) {
      searchQuery = `${activeNote.title} ${activeNote.topic || ''} ${searchQuery}`
    } else {
      const recentHistory = nonSystemHistory
        .slice(-2)
        .map((m) => m.content)
        .join('\n')
      searchQuery = recentHistory ? `${recentHistory}\n${content}`.slice(-600) : content.slice(-600)
    }

    // Retrieve RAG context (increased topK to 5 for better coverage)
    let ragContextBlock = ''
    try {
      const ragResults = await searchNotes(searchQuery, 5)
      ragContextBlock = formatRagContext(ragResults, activeNote?.id)
    } catch {
      // RAG unavailable — proceed without context
    }

    const apiMessages = [
      {
        role: 'system' as const,
        content: systemPrompt + ragContextBlock
      },
      // Rolling window logic: Send only last 10 turns to avoid Token bloat over long conversations
      ...nonSystemHistory
        .slice(-10)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
      { role: 'user' as const, content }
    ]

    let assistantPersisted = false

    await streamChat(
      provider,
      apiMessages,
      {
        onChunk: (chunk) => updateStreamingMessage(assistantId, chunk),
        onReasoningChunk: (chunk) => updateStreamingReasoning(assistantId, chunk),
        onDone: () => {
          finalizeStreamingMessage(assistantId)
          const finalMessage = useStore.getState().messages.find((m) => m.id === assistantId)
          if (finalMessage?.content?.trim() && sessionId) {
            addMessageToSession(sessionId, { role: 'assistant', content: finalMessage.content })
            assistantPersisted = true
          }
        },
        onError: (error) => {
          updateStreamingMessage(assistantId, `\n\nError: ${error}`)
          finalizeStreamingMessage(assistantId)
        }
      },
      currentSignal
    )

    if (currentSignal.aborted) return

    const streamedMessage = useStore.getState().messages.find((m) => m.id === assistantId)
    const hasVisiblePayload =
      !!streamedMessage?.content?.trim() || !!streamedMessage?.reasoning?.trim()
    const streamedLooksCorrupted =
      !!streamedMessage?.content &&
      /你还有问题吗/.test(streamedMessage.content) &&
      /(懂了！也就是说|那我有疑问了)/.test(streamedMessage.content)

    // Some OpenAI-compatible providers (notably certain Gemini gateways) may stream
    // non-standard deltas and end up with empty visible output. Fallback once.
    if (!hasVisiblePayload || streamedLooksCorrupted) {
      try {
        const fallbackReply = await chat(provider, apiMessages)
        if (fallbackReply.trim()) {
          const current = useStore.getState().messages.find((m) => m.id === assistantId)
          if (current?.content?.trim()) {
            // Replace corrupted/empty streamed content with stable non-stream output
            if (current.content !== fallbackReply.trim()) {
              setMessageContent(assistantId, fallbackReply.trim())
            }
          } else {
            setMessageContent(assistantId, fallbackReply.trim())
          }
        } else {
          updateStreamingMessage(assistantId, '[No content returned by provider]')
        }
      } catch (fallbackError) {
        const msg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        updateStreamingMessage(assistantId, `\n\nError: ${msg}`)
      }
    }

    const finalMessageAfterFallback = useStore.getState().messages.find((m) => m.id === assistantId)
    if (!assistantPersisted && finalMessageAfterFallback?.content?.trim() && sessionId) {
      addMessageToSession(sessionId, { role: 'assistant', content: finalMessageAfterFallback.content })
    }
  }, [
    getActiveProvider, isStreaming, activeNote, activeNodes, messages,
    addMessage, updateStreamingMessage, updateStreamingReasoning, setMessageContent, finalizeStreamingMessage,
    setStreaming, setStreamingMessageId, currentSessionId,
    createSessionWithAutoTitle, addMessageToSession
  ])

  const summarizeNodesByContext = useCallback(async (
    providerRole: Exclude<ChatProviderRole, 'auto'> = 'expert',
    maxNodes = 16
  ): Promise<NoteEditResult | null> => {
    if (!activeNote) return null
    const provider = getActiveProvider(providerRole)
    if (!provider) return null

    // Extract deep node context including explanations and feedback
    const nodeSnapshot = activeNodes.slice(0, maxNodes).map((node, index) => {
      const latest = node.currentVersion >= 0 ? node.versions[node.currentVersion] : null
      const explanation = latest?.userExplanation ? `\n  User Explanation: ${latest.userExplanation}` : ''
      
      let feedback = ''
      if (latest?.expertFeedback) {
        const { suggestion, logicErrors, misconceptions } = latest.expertFeedback
        const errorText = [...logicErrors, ...misconceptions].join(', ')
        feedback = `\n  Expert Feedback: ${suggestion}${errorText ? ` (Errors: ${errorText})` : ''}`
      }

      return `${index + 1}. [${node.state}] ${node.label}${explanation}${feedback}`
    }).join('\n\n') || '(no nodes yet)'

    // Extract recent chat history context
    const recentHistory = messages
      .filter((m) => !m.isStreaming && m.role !== 'system')
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n') || '(no chat history)'

    const prompt = [
      'You are an expert Feynman-learning summarizer and Cornell Note editor.',
      'Your task is to rewrite or update the user\'s Cornell notebook strictly based on the provided Context (Chat History and Learning Nodes).',
      'You must output STRICT JSON matching this schema: {"cues":"string","notes":"string","summary":"string","changeSummary":"string"}',
      '',
      'Formatting Rules:',
      '- "cues": Extract key concepts, questions, or vocabulary (Markdown list).',
      '- "notes": The main body of learning notes. Synthesize the user\'s explanations and the expert feedback into a structured markdown document.',
      '- "summary": A brief paragraph summarizing the core logic map, missing weak points, and next-step study checklist.',
      '- "changeSummary": A short sentence describing what you updated.',
      '',
      `Note title: ${activeNote.title}`,
      `Topic: ${activeNote.topic || 'N/A'}`,
      '',
      '--- CURRENT NOTE CONTENT ---',
      '[Cues]',
      activeNote.cornell.cues || '(empty)',
      '[Notes]',
      activeNote.cornell.notes || '(empty)',
      '[Summary]',
      activeNote.cornell.summary || '(empty)',
      '',
      '--- CONTEXT TO INTEGRATE ---',
      '[Chat History]',
      recentHistory,
      '',
      '[Learning Nodes (User attempts & AI feedback)]',
      nodeSnapshot
    ].join('\n')

    const raw = await chat(provider, [{ role: 'user', content: prompt }])
    const parsed = parseJSON<NoteEditResponse>(raw)
    if (!parsed) return null

    const partial: Partial<CornellContent> = {}
    if (typeof parsed.cues === 'string') partial.cues = parsed.cues
    if (typeof parsed.notes === 'string') partial.notes = parsed.notes
    if (typeof parsed.summary === 'string') partial.summary = parsed.summary
    if (Object.keys(partial).length === 0) return null

    return {
      partial,
      changeSummary: typeof parsed.changeSummary === 'string' ? parsed.changeSummary : 'Auto-generated Cornell note from context.',
      raw
    }
  }, [activeNote, activeNodes, messages, getActiveProvider])

  const editNoteByInstruction = useCallback(async (
    instruction: string,
    providerRole: Exclude<ChatProviderRole, 'auto'> = 'expert'
  ): Promise<NoteEditResult | null> => {
    if (!activeNote || !instruction.trim()) return null
    const provider = getActiveProvider(providerRole)
    if (!provider) return null

    const nodeSnapshot = activeNodes.slice(0, 20).map((node, index) => {
      return `${index + 1}. [${node.state}] ${node.label}`
    }).join('\n') || '(no nodes yet)'

    const prompt = [
      'You are a strict Cornell-note editor.',
      'Apply the user instruction to current content and return strict JSON only.',
      'JSON schema:',
      '{"cues":"string","notes":"string","summary":"string","changeSummary":"string"}',
      'Rules:',
      '- Keep original meaning unless instruction requests structural rewrite.',
      '- If a section should stay unchanged, still return the original section text.',
      '- "changeSummary" must be a short sentence describing what changed.',
      '',
      `Instruction: ${instruction.trim()}`,
      '',
      '[Cues]',
      activeNote.cornell.cues || '(empty)',
      '',
      '[Notes]',
      activeNote.cornell.notes || '(empty)',
      '',
      '[Summary]',
      activeNote.cornell.summary || '(empty)',
      '',
      '[Nodes]',
      nodeSnapshot
    ].join('\n')

    const raw = await chat(provider, [{ role: 'user', content: prompt }])
    const parsed = parseJSON<NoteEditResponse>(raw)
    if (!parsed) return null

    const partial: Partial<CornellContent> = {}
    if (typeof parsed.cues === 'string') partial.cues = parsed.cues
    if (typeof parsed.notes === 'string') partial.notes = parsed.notes
    if (typeof parsed.summary === 'string') partial.summary = parsed.summary
    if (Object.keys(partial).length === 0) return null

    return {
      partial,
      changeSummary: typeof parsed.changeSummary === 'string' ? parsed.changeSummary : 'AI updated the note.',
      raw
    }
  }, [activeNote, activeNodes, getActiveProvider])

  const abort = useCallback(() => {
    abortRef.current?.abort()
    const state = useStore.getState()
    if (state.streamingMessageId) {
      state.finalizeStreamingMessage(state.streamingMessageId)
    } else {
      state.setStreaming(false)
      state.setStreamingMessageId(null)
    }
  }, [])

  /**
   * 代码纠错功能
   * 调用专家AI分析代码，返回修正建议
   */
  const reviewCode = useCallback(async (
    code: string,
    language: string
  ): Promise<CodeReviewResult | null> => {
    const provider = getActiveProvider('expert')
    if (!provider) return null

    const prompt = [
      'You are an expert code reviewer. Analyze the following code and provide detailed fixes.',
      'You must respond with STRICT JSON matching this schema:',
      '{',
      '  "overallAssessment": "string - 整体评估（中文）",',
      '  "score": number - 代码质量评分 0-100,',
      '  "fixes": [',
      '    {',
      '      "originalLine": "string - 原始代码行",',
      '      "lineNumber": number - 行号（从1开始）,',
      '      "fixedLine": "string - 修正后的代码",',
      '      "reason": "string - 修正理由（中文）",',
      '      "type": "error|warning|suggestion",',
      '      "severity": number - 严重程度 1-5',
      '    }',
      '  ],',
      '  "optimizationTips": ["string - 优化建议（中文）"],',
      '  "fixedCode": "string - 完整的修正后代码（可选）"',
      '}',
      '',
      'Review Guidelines:',
      '1. Only report actual issues (errors, bugs, potential problems)',
      '2. Provide actionable fixes with clear explanations',
      '3. Use "error" for bugs/errors, "warning" for potential issues, "suggestion" for improvements',
      '4. Focus on correctness, performance, and best practices',
      '5. Respond in Chinese for assessment and reasons',
      '',
      `Programming Language: ${language}`,
      '',
      '--- CODE TO REVIEW ---',
      '```' + language,
      code,
      '```'
    ].join('\n')

    try {
      const raw = await chat(provider, [{ role: 'user', content: prompt }])
      const parsed = parseJSON<CodeReviewResult>(raw)
      
      if (!parsed) {
        return {
          overallAssessment: 'AI 返回的格式不正确，无法解析审查结果。',
          score: 0,
          fixes: [],
          optimizationTips: ['请重试或检查 AI 提供商配置。']
        }
      }

      return parsed
    } catch (error) {
      return {
        overallAssessment: `代码审查失败：${error instanceof Error ? error.message : String(error)}`,
        score: 0,
        fixes: [],
        optimizationTips: ['请检查网络连接和 API 配置。']
      }
    }
  }, [getActiveProvider])

  return {
    messages,
    isStreaming,
    sendMessage,
    summarizeNodesByContext,
    editNoteByInstruction,
    reviewCode,
    abort,
    hasProvider: !!getActiveProvider()
  }
}
