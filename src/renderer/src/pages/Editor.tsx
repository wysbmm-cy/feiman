import React from 'react'
import { CornellEditor } from '../components/editor/CornellEditor'
import { NodeMap } from '../components/nodes/NodeMap'
import { StudentPanel } from '../components/student/StudentPanel'
import { useStore } from '../store'
import { useNodeVerification } from '../hooks/useNodeVerification'
import type { KnowledgeNode } from '../types/node.types'

export function EditorPage() {
  const { studentPanelOpen, setActiveNodes, activeNote } = useStore()
  const { startVerification, submitAnswer, cancelVerification } = useNodeVerification()

  const handleStartVerification = (node: KnowledgeNode, explanation: string) => {
    startVerification(node, explanation)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Center: Cornell editor (top) + NodeMap (bottom) */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-hidden">
          <CornellEditor />
        </div>
        <NodeMap onStartVerification={handleStartVerification} />
      </div>

      {/* Right: Student panel */}
      {studentPanelOpen && (
        <StudentPanel
          onSubmitAnswer={submitAnswer}
          onCancelVerification={cancelVerification}
          onStartVerification={handleStartVerification}
        />
      )}
    </div>
  )
}
