export type NodeState = 'unverified' | 'verifying' | 'verified' | 'failed'
export type NodeType = 'concept' | 'logic' | 'fact' | 'unclear'
export type VerificationMode = 'sync_block' | 'async_parallel' | 'immediate_interrupt'
export type NodeFlowStage =
  | 'idle'
  | 'expert_analyzing'
  | 'test_generating'
  | 'student_solving'
  | 'waiting_user_answer'
  | 'final_analyzing'
  | 'completed_passed'
  | 'completed_failed'
  | 'interrupted'
  | 'cancelled'
  | 'appealed'

export interface StudentQuestion {
  id: string
  question: string
  userAnswer: string
  expertEvaluation?: string
  isFollowUp: boolean
  targetConcept: string
  studentSolution?: string // The student AI's attempt at solving the test question
  solutionCorrect?: boolean // Whether the student AI's solution was correct or exposed the expected trap
}

export interface ExpertFeedback {
  passed: boolean
  score: number
  logicErrors: string[]
  missingConcepts: string[]
  misconceptions: string[]
  strengths: string[]
  suggestion: string
  rawJson: string
}

export interface NodeVersion {
  versionId: string
  attempt: number
  userExplanation: string
  studentQuestions: StudentQuestion[]
  expertFeedback: ExpertFeedback
  createdAt: string
  passed: boolean
  appealReason?: string
}

export interface KnowledgeNode {
  id: string
  label: string
  type: NodeType
  state: NodeState
  verificationMode: VerificationMode
  cornellCueRef?: string
  position: { x: number; y: number }
  dependencies: string[]
  versions: NodeVersion[]
  currentVersion: number
  masteryScore?: number
  createdAt: string
  updatedAt: string
}

export interface VerificationSession {
  sessionId: string
  nodeId: string
  noteId: string
  phase: 'expert_analyzing' | 'test_generating' | 'student_solving' | 'student_questioning' | 'completed'
  studentMessages: { role: 'student' | 'user'; content: string }[]
  expertResult?: ExpertFeedback

  startedAt: string
  completedAt?: string
}

export interface VerificationRun {
  runId: string
  nodeId: string
  mode: VerificationMode
  stage: NodeFlowStage
  startedAt: string
  updatedAt: string
  completedAt?: string
  passed?: boolean
  threshold: number
  error?: string
}

export type VerificationEvent =
  | { type: 'START'; runId: string; mode: VerificationMode; threshold: number }
  | { type: 'PHASE'; phase: VerificationSession['phase'] }
  | { type: 'WAITING_USER_ANSWER' }
  | { type: 'FINAL_RESULT'; feedback: ExpertFeedback; passThreshold: number }
  | { type: 'INTERRUPTED'; reason?: string }
  | { type: 'ERROR'; error: string }
  | { type: 'CANCEL' }
  | { type: 'APPEAL_ACCEPTED'; reason: string }

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  concept: '概念',
  logic: '逻辑',
  fact: '事实',
  unclear: '待澄清',
}

export const VERIFICATION_MODE_MAP: Record<NodeType, VerificationMode> = {
  concept: 'sync_block',
  logic: 'sync_block',
  fact: 'async_parallel',
  unclear: 'immediate_interrupt',
}
