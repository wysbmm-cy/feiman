import type { StateCreator } from 'zustand'
import type {
  ExpertFeedback,
  VerificationSession,
  VerificationRun,
  VerificationEvent,
  NodeFlowStage,
  NodeState
} from '../../types/node.types'
import type { CornellContent } from '../../types/note.types'
import { verificationCache } from '../../lib/cache/verification-cache'

export interface VerificationSlice {
  // Verification state machine
  runsByNode: Record<string, VerificationRun>
  activeRunNodeId: string | null
  dispatchVerificationEvent: (nodeId: string, event: VerificationEvent) => VerificationRun | null
  getNodeRun: (nodeId: string) => VerificationRun | null
  isNodeBusy: (nodeId: string) => boolean

  // Cache
  useCachedVerification: (
    nodeLabel: string,
    userExplanation: string,
    cornell: CornellContent
  ) => { feedback: ExpertFeedback; session: VerificationSession } | null
  
  cacheVerification: (
    nodeLabel: string,
    userExplanation: string,
    cornell: CornellContent,
    feedback: ExpertFeedback,
    session: VerificationSession
  ) => void
  
  clearVerificationCache: () => void
  
  // Appeals
  appeals: AppealRecord[]
  addAppeal: (appeal: Omit<AppealRecord, 'id' | 'timestamp' | 'status'>) => void
  resolveAppeal: (appealId: string, resolution: 'accepted' | 'rejected', reason?: string) => void
  
  // Verification settings
  verificationSettings: VerificationSettings
  updateVerificationSettings: (settings: Partial<VerificationSettings>) => void
}

export interface AppealRecord {
  id: string
  nodeId: string
  nodeLabel: string
  originalFeedback: ExpertFeedback
  userExplanation: string
  reason: string
  additionalExplanation?: string
  timestamp: string
  status: 'pending' | 'accepted' | 'rejected'
  resolutionReason?: string
  resolvedAt?: string
}

export interface VerificationSettings {
  intensity: 'low' | 'medium' | 'high'
  enableCache: boolean
  autoRetry: boolean
  showTestQuestions: boolean
  maxRounds: number
  passThreshold: number
}

const defaultSettings: VerificationSettings = {
  intensity: 'medium',
  enableCache: true,
  autoRetry: false,
  showTestQuestions: true,
  maxRounds: 3,
  passThreshold: 75
}

const BUSY_STAGES: NodeFlowStage[] = [
  'expert_analyzing',
  'test_generating',
  'student_solving',
  'waiting_user_answer',
  'final_analyzing'
]

const TERMINAL_STAGES: NodeFlowStage[] = [
  'completed_passed',
  'completed_failed',
  'interrupted',
  'cancelled',
  'appealed'
]

function isBusyStage(stage: NodeFlowStage): boolean {
  return BUSY_STAGES.includes(stage)
}

function isTerminalStage(stage: NodeFlowStage): boolean {
  return TERMINAL_STAGES.includes(stage)
}

function mapSessionPhaseToFlowStage(phase: VerificationSession['phase']): NodeFlowStage {
  if (phase === 'student_questioning') return 'waiting_user_answer'
  if (phase === 'completed') return 'final_analyzing'
  return phase
}

function mapFlowStageToNodeState(stage: NodeFlowStage): NodeState {
  if (stage === 'completed_passed' || stage === 'appealed') return 'verified'
  if (stage === 'completed_failed' || stage === 'interrupted') return 'failed'
  if (stage === 'idle' || stage === 'cancelled') return 'unverified'
  return 'verifying'
}

export const createVerificationSlice: StateCreator<VerificationSlice> = (set, get) => ({
  // State machine
  runsByNode: {},
  activeRunNodeId: null,

  dispatchVerificationEvent: (nodeId, event) => {
    const state = get()
    const now = new Date().toISOString()
    const current = state.runsByNode[nodeId] || null
    let nextRun: VerificationRun | null = current

    switch (event.type) {
      case 'START': {
        if (current && isBusyStage(current.stage)) return current
        nextRun = {
          runId: event.runId,
          nodeId,
          mode: event.mode,
          stage: 'expert_analyzing',
          startedAt: now,
          updatedAt: now,
          threshold: event.threshold
        }
        break
      }
      case 'PHASE': {
        if (!current) return null
        nextRun = {
          ...current,
          stage: mapSessionPhaseToFlowStage(event.phase),
          updatedAt: now
        }
        break
      }
      case 'WAITING_USER_ANSWER': {
        if (!current) return null
        nextRun = {
          ...current,
          stage: 'waiting_user_answer',
          updatedAt: now
        }
        break
      }
      case 'FINAL_RESULT': {
        if (!current) return null
        const isPassed = event.feedback.passed && event.feedback.score >= event.passThreshold
        nextRun = {
          ...current,
          stage: isPassed ? 'completed_passed' : 'completed_failed',
          passed: isPassed,
          threshold: event.passThreshold,
          updatedAt: now,
          completedAt: now
        }
        break
      }
      case 'INTERRUPTED': {
        if (!current) return null
        nextRun = {
          ...current,
          stage: 'interrupted',
          error: event.reason,
          updatedAt: now,
          completedAt: now
        }
        break
      }
      case 'ERROR': {
        if (!current) return null
        nextRun = {
          ...current,
          stage: 'interrupted',
          error: event.error,
          updatedAt: now,
          completedAt: now
        }
        break
      }
      case 'CANCEL': {
        if (!current) return null
        nextRun = {
          ...current,
          stage: 'cancelled',
          updatedAt: now,
          completedAt: now
        }
        break
      }
      case 'APPEAL_ACCEPTED': {
        const threshold = current?.threshold ?? get().verificationSettings.passThreshold
        nextRun = {
          runId: current?.runId ?? `appeal_${Date.now()}`,
          nodeId,
          mode: current?.mode ?? 'sync_block',
          stage: 'appealed',
          startedAt: current?.startedAt ?? now,
          updatedAt: now,
          completedAt: now,
          passed: true,
          threshold
        }
        break
      }
      default:
        return null
    }

    if (!nextRun) return null
    const mappedNodeState = mapFlowStageToNodeState(nextRun.stage)

    set((prev: any) => {
      const nextRunsByNode = { ...prev.runsByNode, [nodeId]: nextRun }
      let nextActiveRunNodeId = prev.activeRunNodeId

      if (event.type === 'START' && event.mode !== 'async_parallel') {
        nextActiveRunNodeId = nodeId
      }
      if (isTerminalStage(nextRun.stage) && prev.activeRunNodeId === nodeId) {
        nextActiveRunNodeId = null
      }

      const patch: Record<string, unknown> = {
        runsByNode: nextRunsByNode,
        activeRunNodeId: nextActiveRunNodeId
      }

      if (Array.isArray(prev.activeNodes)) {
        patch.activeNodes = prev.activeNodes.map((node: any) => (
          node.id === nodeId
            ? { ...node, state: mappedNodeState, updatedAt: now }
            : node
        ))
      }

      return patch
    })

    if (event.type === 'APPEAL_ACCEPTED') {
      const fullStore = get() as any
      if (typeof fullStore.appealNode === 'function') {
        fullStore.appealNode(nodeId, event.reason)
      }
    }

    return nextRun
  },

  getNodeRun: (nodeId) => get().runsByNode[nodeId] || null,

  isNodeBusy: (nodeId) => {
    const run = get().runsByNode[nodeId]
    return !!run && isBusyStage(run.stage)
  },

  // Cache methods
  useCachedVerification: (nodeLabel, userExplanation, cornell) => {
    if (!get().verificationSettings.enableCache) return null
    return verificationCache.get(nodeLabel, userExplanation, cornell)
  },
  
  cacheVerification: (nodeLabel, userExplanation, cornell, feedback, session) => {
    if (!get().verificationSettings.enableCache) return
    verificationCache.set(nodeLabel, userExplanation, cornell, feedback, session)
  },
  
  clearVerificationCache: () => {
    verificationCache.clear()
  },
  
  // Appeals
  appeals: [],
  
  addAppeal: (appeal) => {
    const newAppeal: AppealRecord = {
      ...appeal,
      id: `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }
    
    set((state) => ({
      appeals: [newAppeal, ...state.appeals]
    }))
    
    // Persist to localStorage
    const stored = localStorage.getItem('feiman_appeals')
    const existing = stored ? JSON.parse(stored) : []
    localStorage.setItem('feiman_appeals', JSON.stringify([newAppeal, ...existing]))
  },
  
  resolveAppeal: (appealId, resolution, reason) => {
    set((state) => ({
      appeals: state.appeals.map((appeal) =>
        appeal.id === appealId
          ? {
              ...appeal,
              status: resolution,
              resolutionReason: reason,
              resolvedAt: new Date().toISOString()
            }
          : appeal
      )
    }))
    
    // Update localStorage
    const stored = localStorage.getItem('feiman_appeals')
    if (stored) {
      const appeals = JSON.parse(stored)
      const updated = appeals.map((appeal: AppealRecord) =>
        appeal.id === appealId
          ? {
              ...appeal,
              status: resolution,
              resolutionReason: reason,
              resolvedAt: new Date().toISOString()
            }
          : appeal
      )
      localStorage.setItem('feiman_appeals', JSON.stringify(updated))
    }
  },
  
  // Settings
  verificationSettings: defaultSettings,
  
  updateVerificationSettings: (settings) => {
    set((state) => ({
      verificationSettings: {
        ...state.verificationSettings,
        ...settings
      }
    }))
    
    // Persist to localStorage
    localStorage.setItem('feiman_verification_settings', JSON.stringify({
      ...get().verificationSettings,
      ...settings
    }))
  }
})

// Load persisted data on initialization
export function loadPersistedVerificationData(): Partial<VerificationSlice> {
  const data: Partial<VerificationSlice> = {}
  
  // Load settings
  const storedSettings = localStorage.getItem('feiman_verification_settings')
  if (storedSettings) {
    data.verificationSettings = { ...defaultSettings, ...JSON.parse(storedSettings) }
  }
  
  // Load appeals
  const storedAppeals = localStorage.getItem('feiman_appeals')
  if (storedAppeals) {
    data.appeals = JSON.parse(storedAppeals)
  }
  
  return data
}
