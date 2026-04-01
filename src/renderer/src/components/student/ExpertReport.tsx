import React, { useState } from 'react'
import type { ExpertFeedback } from '../../types/node.types'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ExpertReportProps {
  feedback: ExpertFeedback
  compact?: boolean
}

export function ExpertReport({ feedback, compact }: ExpertReportProps) {
  const [expanded, setExpanded] = useState(!compact)
  const passed = feedback.passed

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: passed ? 'var(--node-verified)' : 'var(--node-failed)',
        background: passed ? 'var(--node-verified)0a' : 'var(--node-failed)0a'
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-2 p-2.5 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {passed
          ? <CheckCircle size={14} style={{ color: 'var(--node-verified)', flexShrink: 0 }} />
          : <XCircle size={14} style={{ color: 'var(--node-failed)', flexShrink: 0 }} />
        }
        <span className="text-xs font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
          专家评分：{feedback.score}分 {passed ? '✓ 通过' : '✗ 需改进'}
        </span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Suggestion */}
          <div
            className="text-xs p-2 rounded-lg"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          >
            💡 {feedback.suggestion}
          </div>

          {/* Strengths */}
          {feedback.strengths.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--node-verified)' }}>
                ✓ 做得好
              </p>
              {feedback.strengths.map((s, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--text-primary)' }}>• {s}</p>
              ))}
            </div>
          )}

          {/* Logic errors */}
          {feedback.logicErrors.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--node-failed)' }}>
                ✗ 逻辑错误
              </p>
              {feedback.logicErrors.map((e, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--text-primary)' }}>• {e}</p>
              ))}
            </div>
          )}

          {/* Missing concepts */}
          {feedback.missingConcepts.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--node-verifying)' }}>
                △ 遗漏概念
              </p>
              {feedback.missingConcepts.map((c, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--text-primary)' }}>• {c}</p>
              ))}
            </div>
          )}

          {/* Misconceptions */}
          {feedback.misconceptions.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--warning)' }}>
                ⚠ 理解偏差
              </p>
              {feedback.misconceptions.map((m, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--text-primary)' }}>• {m}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
