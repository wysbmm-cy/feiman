import type { KnowledgeNode, ExpertFeedback, NodeVersion, VerificationSession, StudentQuestion } from '../../types/node.types'
import type { CornellContent } from '../../types/note.types'
import type { AIProviderConfig } from '../../types/ai.types'
import { chat, streamChat } from './client'
import {
  buildExpertSystemPrompt,
  buildExpertAnalysisPrompt,
  buildQuickEvalPrompt,
  buildTestQuestionPrompt,
  buildExpertMonitorPrompt,
  parseExpertFeedback
} from './expert-prompts'
import {
  buildStudentSystemPrompt,
  buildStudentInitialPrompt,
  buildStudentFollowupPrompt,
  buildStudentSolvingPrompt
} from './student-prompts'
import { v4 as uuidv4 } from 'uuid'

export interface OrchestratorCallbacks {
  onStudentChunk: (chunk: string) => void
  onStudentDone: (fullText: string) => void
  onExpertAnalyzing: () => void
  onExpertDone: (result: ExpertFeedback) => void
  onSessionPhaseChange: (phase: VerificationSession['phase']) => void
  onError: (error: string) => void
  onTestGenerated?: (questions: any) => void
  onStudentSolving?: () => void
  onStudentSolved?: (solution: string) => void
  onExpertInterrupt?: (reason: string, error: string) => void
}

export interface MonitorResult {
  interrupt: boolean
  reason?: string
  criticalError?: string
}

export interface VerificationResult {
  passed: boolean
  version: NodeVersion
  session: VerificationSession
}

const MAX_ROUNDS = 3

/**
 * Full node verification flow:
 * 1. Expert AI analyzes user's explanation
 * 2. If score < 85, Student AI asks questions (up to MAX_ROUNDS)
 * 3. Expert AI makes final judgment
 */
export async function verifyNode(
  node: KnowledgeNode,
  userExplanation: string,
  cornell: CornellContent,
  expertProvider: AIProviderConfig,
  studentProvider: AIProviderConfig,
  topic: string,
  callbacks: OrchestratorCallbacks,
  getUserAnswer: (question: string) => Promise<string>,
  signal?: AbortSignal
): Promise<VerificationResult> {
  const sessionId = uuidv4()
  const session: VerificationSession = {
    sessionId,
    nodeId: node.id,
    noteId: '', // set by caller
    phase: 'expert_analyzing',
    studentMessages: [],
    startedAt: new Date().toISOString()
  }

  callbacks.onSessionPhaseChange('expert_analyzing')
  callbacks.onExpertAnalyzing()

  // Step 1: Initial expert analysis
  const expertMessages = [
    { role: 'system' as const, content: buildExpertSystemPrompt() },
    { role: 'user' as const, content: buildExpertAnalysisPrompt(node, userExplanation, cornell) }
  ]

  let expertResponse: string
  try {
    expertResponse = await chat(expertProvider, expertMessages)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    callbacks.onError(`专家 AI 调用失败：${msg}`)
    throw err
  }

  let expertResult = parseExpertFeedback(expertResponse)
  if (!expertResult) {
    expertResult = {
      passed: false,
      score: 0,
      logicErrors: ['专家 AI 返回格式异常'],
      missingConcepts: [],
      misconceptions: [],
      strengths: [],
      suggestion: '请重试',
      rawJson: expertResponse
    }
  }

  callbacks.onExpertDone(expertResult)

  // Fast pass: score >= 85 means no student questioning needed
  if (expertResult.passed && expertResult.score >= 85) {
    session.expertResult = expertResult
    session.phase = 'completed'
    session.completedAt = new Date().toISOString()

    const version = buildNodeVersion(node, userExplanation, [], expertResult)
    return { passed: true, version, session }
  }

  // NEW STEP (P0-1): '以题验教' Flow
  // 1. Expert generates a test question
  callbacks.onSessionPhaseChange('test_generating')
  const testQuestionMessages = [
    { role: 'system' as const, content: buildExpertSystemPrompt() },
    { role: 'user' as const, content: buildTestQuestionPrompt(node, userExplanation, expertResult) }
  ]

  let testGenerated: { question: string, expectedTrap: string } | null = null
  try {
    const testResponse = await chat(expertProvider, testQuestionMessages)
    testGenerated = parseJSON(testResponse)
    if (testGenerated && callbacks.onTestGenerated) {
      callbacks.onTestGenerated(testGenerated)
    }
  } catch (e) {
    console.warn('Failed to generate test question', e)
  }

  const studentQuestions: StudentQuestion[] = []

  // 2. Student AI solves the question using user logic
  if (testGenerated && testGenerated.question) {
    callbacks.onSessionPhaseChange('student_solving')
    if (callbacks.onStudentSolving) callbacks.onStudentSolving()

    const solvingMessages = [
      { role: 'system' as const, content: buildStudentSystemPrompt(node, topic) },
      { role: 'user' as const, content: buildStudentSolvingPrompt(node, userExplanation, testGenerated.question) }
    ]

    let studentSolution = ''
    try {
      if (signal?.aborted) return { passed: expertResult.passed, version: buildNodeVersion(node, userExplanation, [], expertResult), session }

      await new Promise<void>((resolve) => {
        streamChat(
          studentProvider,
          solvingMessages,
          {
            onChunk: (chunk) => {
              studentSolution += chunk
              callbacks.onStudentChunk(chunk) // Reusing the chunk callback to show typing
            },
            onDone: () => resolve(),
            onError: (err) => {
              console.warn('Student solving failed:', err)
              resolve()
            }
          },
          signal
        )
      })

      if (callbacks.onStudentSolved) {
        callbacks.onStudentSolved(studentSolution)
      }

      // Record this interaction in the session messages so it's visible in the UI
      session.studentMessages.push({ role: 'student', content: `老师，我尝试用您刚才讲的方法解答了一道测试题：\n\n【题目】\n${testGenerated.question}\n\n【我的解答】\n${studentSolution}` })

      const sq: StudentQuestion = {
        id: uuidv4(),
        question: testGenerated.question,
        userAnswer: '', // User will answer in the next step
        isFollowUp: false,
        targetConcept: node.label,
        studentSolution,
        solutionCorrect: false
      }
      studentQuestions.push(sq)

    } catch (e) {
      console.warn('Student solving error', e)
    }
  }

  // Step 2: Student AI questioning loop
  callbacks.onSessionPhaseChange('student_questioning')

  const studentHistory: { role: 'student' | 'user'; content: string } = { role: 'student', content: '' } // placeholder

  const studentSysPrompt = buildStudentSystemPrompt(node, topic)

  for (let round = 0; round < MAX_ROUNDS; round++) {
    if (signal?.aborted) break

    let studentQuestion = ''

    if (round === 0 && studentQuestions.length > 0 && studentQuestions[0].studentSolution) {
      // We skip asking a new question because the student just provided a solution that the user needs to correct
      studentQuestion = studentQuestions[0].question
    } else {
      // Build student prompt
      const isFirstRound = round === 0
      const studentUserPrompt = isFirstRound
        ? buildStudentInitialPrompt(node, expertResult)
        : buildStudentFollowupPrompt(node, expertResult, session.studentMessages)

      const studentChatMessages = [
        { role: 'system' as const, content: studentSysPrompt },
        ...session.studentMessages.map(m => ({
          role: (m.role === 'student' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.content
        })),
        { role: 'user' as const, content: studentUserPrompt }
      ]

      await new Promise<void>((resolve) => {
        streamChat(
          studentProvider,
          studentChatMessages,
          {
            onChunk: (chunk) => {
              studentQuestion += chunk
              callbacks.onStudentChunk(chunk)
            },
            onDone: () => {
              callbacks.onStudentDone(studentQuestion)
              resolve()
            },
            onError: (err) => {
              callbacks.onError(`学生 AI 调用失败：${err}`)
              resolve()
            }
          },
          signal
        )
      })

      if (!studentQuestion.trim()) break

      // Record student question in session
      session.studentMessages.push({ role: 'student', content: studentQuestion })
    }

    // Check if student says they understand
    const isUnderstood = /明白了|理解了|懂了|对的|正确/.test(studentQuestion)
    if (isUnderstood && round > 0) break

    // Get user's answer
    let userAnswer = ''
    try {
      userAnswer = await getUserAnswer(studentQuestion)
    } catch {
      // User cancelled
      break
    }

    if (!userAnswer.trim()) break

    session.studentMessages.push({ role: 'user', content: userAnswer })

    if (round === 0 && studentQuestions.length > 0 && studentQuestions[0].studentSolution) {
      studentQuestions[0].userAnswer = userAnswer
    } else {
      const sq: StudentQuestion = {
        id: uuidv4(),
        question: studentQuestion,
        userAnswer,
        isFollowUp: round > 0,
        targetConcept: node.label
      }
      studentQuestions.push(sq)
    }

    // Quick eval of this answer
    try {
      const quickEvalResponse = await chat(expertProvider, [
        { role: 'system', content: buildExpertSystemPrompt() },
        { role: 'user', content: buildQuickEvalPrompt(studentQuestion, userAnswer, node.label) }
      ])
      const quickEval = parseJSON<{ isCorrect: boolean; conceptsClearedCount: number; briefFeedback: string }>(quickEvalResponse)

      const currentSq = studentQuestions[studentQuestions.length - 1]
      if (currentSq) currentSq.expertEvaluation = quickEval?.briefFeedback

      // If enough concepts cleared, stop early
      if ((quickEval?.conceptsClearedCount ?? 0) >= expertResult.missingConcepts.length && round >= 1) break
    } catch {
      // Continue even if quick eval fails
    }
  }

  // Step 3: Final expert assessment
  callbacks.onExpertAnalyzing()
  callbacks.onSessionPhaseChange('expert_analyzing')
  const finalExpertMessages = [
    { role: 'system' as const, content: buildExpertSystemPrompt() },
    {
      role: 'user' as const,
      content: buildExpertAnalysisPrompt(node, userExplanation, cornell, studentQuestions)
    }
  ]

  let finalExpertResponse: string
  try {
    finalExpertResponse = await chat(expertProvider, finalExpertMessages)
  } catch (err) {
    finalExpertResponse = expertResponse // fallback to first analysis
  }

  const finalResult = parseExpertFeedback(finalExpertResponse) || expertResult
  callbacks.onExpertDone(finalResult)

  session.expertResult = finalResult
  session.phase = 'completed'
  session.completedAt = new Date().toISOString()

  const version = buildNodeVersion(node, userExplanation, studentQuestions, finalResult)
  return { passed: finalResult.passed, version, session }
}

function buildNodeVersion(
  node: KnowledgeNode,
  userExplanation: string,
  questions: StudentQuestion[],
  feedback: ExpertFeedback
): NodeVersion {
  return {
    versionId: uuidv4(),
    attempt: node.versions.length + 1,
    userExplanation,
    studentQuestions: questions,
    expertFeedback: feedback,
    createdAt: new Date().toISOString(),
    passed: feedback.passed
  }
}

function parseJSON<T>(raw: string): T | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

/**
 * NEW: Monitor user explanation for critical errors independently.
 */
export async function monitorExplanation(
  nodeName: string,
  userExplanation: string,
  expertProvider: AIProviderConfig
): Promise<MonitorResult> {
  const messages = [
    { role: 'system' as const, content: buildExpertSystemPrompt() },
    { role: 'user' as const, content: buildExpertMonitorPrompt(nodeName, userExplanation) }
  ]

  try {
    const response = await chat(expertProvider, messages)
    return parseJSON<MonitorResult>(response) || { interrupt: false }
  } catch (err) {
    console.error('Expert monitor failed:', err)
    return { interrupt: false }
  }
}
