import { useRef, useCallback } from 'react'
import { useStore } from '../store'
import { verifyNode, monitorExplanation } from '../lib/ai/dual-ai-orchestrator'
import type { KnowledgeNode, VerificationSession } from '../types/node.types'
import { v4 as uuidv4 } from 'uuid'
import { useElectron } from './useElectron'

/**
 * Hook that manages node verification lifecycle.
 * Connects the dual-AI orchestrator to the Zustand store.
 */
export function useNodeVerification() {
  const api = useElectron()
  const {
    activeNote,
    settings,
    addNodeVersion,
    setActiveSession,
    updateSessionPhase,
    addStudentMessage,
    setExpertResult,
    setExpertAnalyzing,
    setStudentTyping,
    clearSession,
    addMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    setStreaming,
    setStreamingMessageId,
    addAsyncResult,
    dispatchVerificationEvent,
    isNodeBusy,
    getNodeRun,
    verificationSettings
  } = useStore()

  const abortRef = useRef<AbortController | null>(null)
  const persistTimerRef = useRef<number | null>(null)
  // getUserAnswer is set by StudentPanel when waiting for input
  const getUserAnswerRef = useRef<((q: string) => Promise<string>) | null>(null)

  const expertProvider = settings.aiProviders.find(p => p.id === (settings.expertProviderId || settings.activeProviderId)) ?? settings.aiProviders[0] ?? null
  const studentProvider = settings.studentProviderId
    ? settings.aiProviders.find(p => p.id === settings.studentProviderId) ?? expertProvider
    : expertProvider

  const schedulePersistNodeChanges = useCallback(() => {
    if (!api) return
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current)
    }
    persistTimerRef.current = window.setTimeout(async () => {
      const store = useStore.getState()
      const note = store.activeNote
      if (!note) return
      const updatedNote = { ...note, nodes: store.activeNodes }
      store.updateNoteNodes(store.activeNodes)
      store.setSaving(true)
      try {
        await api.writeNote(updatedNote as Parameters<typeof api.writeNote>[0])
        store.setLastSaved(new Date().toISOString())
      } finally {
        store.setSaving(false)
      }
    }, 800)
  }, [api])

  const normalizeNodeVersion = useCallback((version: any, passThreshold: number) => {
    const passed = version.expertFeedback.passed && version.expertFeedback.score >= passThreshold
    return {
      ...version,
      passed
    }
  }, [])

  const startAsyncVerification = useCallback(async (node: KnowledgeNode, userExplanation: string) => {
    if (!activeNote || !expertProvider || !studentProvider) return

    // Background execution, don't set NodeState to verifying so it doesn't block UI
    try {
      const result = await verifyNode(
        node,
        userExplanation,
        activeNote.cornell,
        expertProvider,
        studentProvider,
        activeNote.topic,
        {
          onStudentChunk: () => { }, // No UI updates
          onStudentDone: () => { },
          onExpertAnalyzing: () => {
            dispatchVerificationEvent(node.id, { type: 'PHASE', phase: 'expert_analyzing' })
          },
          onExpertDone: () => { },
          onSessionPhaseChange: (phase) => {
            dispatchVerificationEvent(node.id, { type: 'PHASE', phase })
          },
          onError: (error) => {
            dispatchVerificationEvent(node.id, { type: 'ERROR', error })
          }
        },
        async () => {
          // In async mode, the student shouldn't ask questions because user is busy.
          // If it tries to, we just return an empty string to force it to finish.
          return ""
        }
      )

      const passThreshold = useStore.getState().verificationSettings.passThreshold
      const normalizedVersion = normalizeNodeVersion(result.version, passThreshold)
      // Update node version
      addNodeVersion(node.id, normalizedVersion)
      dispatchVerificationEvent(node.id, {
        type: 'FINAL_RESULT',
        feedback: normalizedVersion.expertFeedback,
        passThreshold
      })

      // Update the async results queue so the UI can show a subtle notification
      addAsyncResult({
        nodeId: node.id,
        passed: normalizedVersion.passed,
        message: normalizedVersion.passed ? '事实验证通过' : '事实验证失败，此内容可能存在事实错误。',
        timestamp: new Date().toISOString()
      })

      schedulePersistNodeChanges()
    } catch (e) {
      console.error('Async verification failed:', e)
    }
  }, [activeNote, expertProvider, studentProvider, dispatchVerificationEvent, addNodeVersion, addAsyncResult, normalizeNodeVersion, schedulePersistNodeChanges])

  const startVerification = useCallback(async (
    node: KnowledgeNode,
    userExplanation: string
  ) => {
    if (!activeNote || !expertProvider) return
    if (!userExplanation.trim()) return
    if (isNodeBusy(node.id)) return

    // Cancel previous verification if running
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const passThreshold = verificationSettings.passThreshold
    dispatchVerificationEvent(node.id, {
      type: 'START',
      runId: uuidv4(),
      mode: node.verificationMode,
      threshold: passThreshold
    })

    // Create session
    const session: VerificationSession = {
      sessionId: uuidv4(),
      nodeId: node.id,
      noteId: activeNote.id,
      phase: 'expert_analyzing',
      studentMessages: [],
      startedAt: new Date().toISOString()
    }
    if (node.verificationMode !== 'async_parallel') {
      setActiveSession(session)
    }

    // Add streaming message slot for student AI
    const streamMsgId = uuidv4()

    try {
      // Auto-routing based on verificationMode
      if (node.verificationMode === 'async_parallel') {
        // Run in background and return immediately
        window.alert(`【${node.label}】是一项事实知识，已转入后台异步验证。您可以继续学习。`)
        startAsyncVerification(node, userExplanation)
        return
      }

      if (node.verificationMode === 'immediate_interrupt') {
        if (userExplanation.length < 10) {
          dispatchVerificationEvent(node.id, {
            type: 'INTERRUPTED',
            reason: '描述过短，触发即时打断'
          })
          clearSession()
          window.alert(`【打断】您对「${node.label}」的描述过于简略，请先补充更多细节再验证。`)
          return
        }
      }

      // NEW: Parallel Expert Monitor
      monitorExplanation(node.label, userExplanation, expertProvider).then(result => {
        if (result.interrupt && controller.signal.aborted === false) {
          addStudentMessage('student', `🚨 **专家实时干预**\n\n**原因**：${result.reason}\n\n**错误点**：${result.criticalError}\n\n已打断当前验证流程，请修正你的讲解。`)
          dispatchVerificationEvent(node.id, {
            type: 'INTERRUPTED',
            reason: result.reason || result.criticalError
          })
          controller.abort()
        }
      })

      const result = await verifyNode(
        node,
        userExplanation,
        activeNote.cornell,
        expertProvider,
        studentProvider!,
        activeNote.topic,
        {
          onStudentChunk: (chunk) => {
            setStudentTyping(true)
            if (!useStore.getState().messages.find(m => m.id === streamMsgId)) {
              addMessage({
                id: streamMsgId,
                role: 'assistant',
                content: chunk,
                timestamp: new Date().toISOString(),
                isStreaming: true
              })
              setStreamingMessageId(streamMsgId)
              setStreaming(true)
            } else {
              updateStreamingMessage(streamMsgId, chunk)
            }
          },
          onStudentDone: (fullText) => {
            finalizeStreamingMessage(streamMsgId)
            setStudentTyping(false)
            addStudentMessage('student', fullText)
          },
          onExpertAnalyzing: () => {
            setExpertAnalyzing(true)
            updateSessionPhase('expert_analyzing')
            dispatchVerificationEvent(node.id, { type: 'PHASE', phase: 'expert_analyzing' })
          },
          onExpertDone: (result) => {
            setExpertAnalyzing(false)
            setExpertResult(result)
          },
          onSessionPhaseChange: (phase) => {
            updateSessionPhase(phase)
            dispatchVerificationEvent(node.id, { type: 'PHASE', phase })
            if (phase === 'student_questioning') {
              dispatchVerificationEvent(node.id, { type: 'WAITING_USER_ANSWER' })
            }
          },
          onExpertInterrupt: (reason, error) => {
            // This is matched in StudentPanel via the state update or a specific callback
            // For now, we'll store it in a way the UI can reactive to
            addStudentMessage('student', `⚠️ **专家紧急干预**\n\n**原因**：${reason}\n\n**错误点**：${error}\n\n已暂停验证流程，请修正后再试。`)
            dispatchVerificationEvent(node.id, { type: 'INTERRUPTED', reason: `${reason}: ${error}` })
            abortRef.current?.abort()
          },
          onError: (err) => {
            console.error('Verification error:', err)
            dispatchVerificationEvent(node.id, { type: 'ERROR', error: err })
            clearSession()
          }
        },
        // getUserAnswer: called when student AI needs user's answer
        (question) => {
          dispatchVerificationEvent(node.id, { type: 'WAITING_USER_ANSWER' })
          addStudentMessage('student', question)
          return new Promise<string>((resolve, reject) => {
            // Store resolver so StudentPanel can call it when user submits answer
            getUserAnswerRef.current = (answer: string) => {
              getUserAnswerRef.current = null
              addStudentMessage('user', answer)
              resolve(answer)
              return Promise.resolve(answer)
            }
            // Timeout after 10 minutes
            setTimeout(() => {
              if (getUserAnswerRef.current) {
                getUserAnswerRef.current = null
                reject(new Error('timeout'))
              }
            }, 10 * 60 * 1000)
          })
        },
        controller.signal
      )

      const normalizedVersion = normalizeNodeVersion(result.version, passThreshold)
      // Update node with verification result
      addNodeVersion(node.id, normalizedVersion)
      dispatchVerificationEvent(node.id, {
        type: 'FINAL_RESULT',
        feedback: normalizedVersion.expertFeedback,
        passThreshold
      })
      updateSessionPhase('completed')
      schedulePersistNodeChanges()

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        const run = getNodeRun(node.id)
        if (run && isNodeBusy(node.id)) {
          dispatchVerificationEvent(node.id, { type: 'CANCEL' })
        }
      } else {
        dispatchVerificationEvent(node.id, {
          type: 'ERROR',
          error: err instanceof Error ? err.message : String(err)
        })
      }
      clearSession()
      setStreaming(false)
      setStreamingMessageId(null)
      getUserAnswerRef.current = null
    }
  }, [
    activeNote,
    expertProvider,
    studentProvider,
    verificationSettings.passThreshold,
    isNodeBusy,
    dispatchVerificationEvent,
    setActiveSession,
    startAsyncVerification,
    addStudentMessage,
    addMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    setStudentTyping,
    setExpertAnalyzing,
    updateSessionPhase,
    setExpertResult,
    clearSession,
    setStreaming,
    setStreamingMessageId,
    addNodeVersion,
    getNodeRun,
    normalizeNodeVersion,
    schedulePersistNodeChanges
  ])

  const submitAnswer = useCallback((answer: string) => {
    if (getUserAnswerRef.current) {
      getUserAnswerRef.current(answer)
    }
  }, [])

  const cancelVerification = useCallback(() => {
    const store = useStore.getState()
    const nodeId = store.activeSession?.nodeId || store.activeRunNodeId
    if (nodeId && store.isNodeBusy(nodeId)) {
      store.dispatchVerificationEvent(nodeId, { type: 'CANCEL' })
    }
    abortRef.current?.abort()
    clearSession()
    setStreaming(false)
    setStreamingMessageId(null)
    getUserAnswerRef.current = null
  }, [])

  const isWaitingForAnswer = useCallback(() => {
    return getUserAnswerRef.current !== null
  }, [])

  return {
    startVerification,
    submitAnswer,
    cancelVerification,
    isWaitingForAnswer,
    canVerify: !!expertProvider && !!activeNote
  }
}
