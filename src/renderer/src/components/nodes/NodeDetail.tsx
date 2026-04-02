import React, { useState } from 'react'
import { useStore } from '../../store'
import type { KnowledgeNode, NodeVersion } from '../../types/node.types'
import { NODE_TYPE_LABELS } from '../../types/node.types'
import { ChevronDown, ChevronUp, RotateCcw, CheckCircle, XCircle, ShieldAlert } from 'lucide-react'

interface NodeDetailProps {
  node: KnowledgeNode
  onRetry: (node: KnowledgeNode) => void
}

export function NodeDetail({ node, onRetry }: NodeDetailProps) {
  const { dispatchVerificationEvent, isNodeBusy, rollbackNodeVersion } = useStore()
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [isAppealing, setIsAppealing] = useState(false)
  const [appealReason, setAppealReason] = useState('')
  const busy = isNodeBusy(node.id)
  const sortedVersions = [...node.versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const activeVersion = node.currentVersion >= 0 ? node.versions[node.currentVersion] : null
  const activeVersionId = activeVersion?.versionId || null
  const latestFailedVersion = sortedVersions.find((v) => !v.passed) || null
  const failedReasonSummary = latestFailedVersion ? getFailedReasonSummary(latestFailedVersion) : null

  const stateColor = {
    unverified: 'var(--node-unverified)',
    verifying: 'var(--node-verifying)',
    verified: 'var(--node-verified)',
    failed: 'var(--node-failed)'
  }[node.state]

  const stateLabel = {
    unverified: '待验证',
    verifying: '验证中...',
    verified: '已掌握',
    failed: '需改进'
  }[node.state]

  const handleAppeal = () => {
    if (!appealReason.trim()) return
    dispatchVerificationEvent(node.id, { type: 'APPEAL_ACCEPTED', reason: appealReason.trim() })
    setIsAppealing(false)
    setAppealReason('')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Node header */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {node.label}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-1.5 py-0.5 rounded-lg"
                style={{
                  background: `color-mix(in srgb, ${stateColor}, transparent 85%)`,
                  color: stateColor,
                  border: `1px solid color-mix(in srgb, ${stateColor}, transparent 60%)`,
                }}
              >
                {stateLabel}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {NODE_TYPE_LABELS[node.type]}
              </span>
              {node.masteryScore != null && (
                <span className="text-xs font-medium" style={{ color: stateColor }}>
                  {node.masteryScore}分
                </span>
              )}
              {activeVersion && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                  当前版本 v{activeVersion.attempt}
                </span>
              )}
            </div>
          </div>

          {(node.state === 'failed' || node.state === 'verified') && !isAppealing && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onRetry(node)}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:opacity-80"
                style={{
                  background: 'var(--bg-overlay)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <RotateCcw size={13} />
                {busy ? '验证中…' : '重试验证'}
              </button>
              {node.state === 'failed' && (
                <button
                  onClick={() => setIsAppealing(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:opacity-80"
                  style={{
                    background: 'transparent',
                    color: 'var(--danger)',
                    border: '1px solid color-mix(in srgb, var(--danger), transparent 50%)',
                  }}
                >
                  <ShieldAlert size={13} />
                  申诉
                </button>
              )}
            </div>
          )}
        </div>

        {/* Appeal Input Form */}
        {isAppealing && (
          <div
            className="mt-4 p-3 rounded-xl"
            style={{
              background: 'color-mix(in srgb, var(--danger), transparent 92%)',
              border: '1px solid color-mix(in srgb, var(--danger), transparent 60%)',
            }}
          >
            <h4
              className="text-xs font-bold flex items-center gap-1.5 mb-2"
              style={{ color: 'var(--danger)' }}
            >
              <ShieldAlert size={14} />
              强制申诉
            </h4>
            <p className="text-[10px] mb-2" style={{ color: 'var(--text-secondary)' }}>
              如果你确信 AI 判断有误，可填写申诉理由强制通过该节点。
            </p>
            <textarea
              className="w-full p-2 text-xs resize-none outline-none rounded-lg transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid color-mix(in srgb, var(--danger), transparent 60%)',
                color: 'var(--text-primary)',
              }}
              rows={3}
              placeholder="输入申诉理由..."
              value={appealReason}
              onChange={e => setAppealReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setIsAppealing(false)}
                className="px-3 py-1 text-xs rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                取消
              </button>
              <button
                onClick={handleAppeal}
                className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:opacity-80"
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                }}
              >
                确认申诉
              </button>
            </div>
          </div>
        )}

        {/* Latest expert suggestion */}
        {activeVersion && (
          <div
            className="mt-2 p-2 rounded-lg text-xs"
            style={{
              background: 'color-mix(in srgb, var(--bg-overlay), transparent 40%)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            💡 {activeVersion.expertFeedback.suggestion}
          </div>
        )}

        {failedReasonSummary && (
          <div
            className="mt-2 p-2 rounded-lg text-xs"
            style={{
              background: 'color-mix(in srgb, var(--danger), transparent 92%)',
              color: 'var(--danger)',
              border: '1px solid color-mix(in srgb, var(--danger), transparent 70%)'
            }}
          >
            失败摘要：{failedReasonSummary}
          </div>
        )}
      </div>

      {/* Version history */}
      <div className="flex-1 overflow-y-auto p-3">
        {node.versions.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
            暂无验证记录
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              验证历史 ({node.versions.length} 次)
            </p>
            {sortedVersions.map((version, idx) => (
              <VersionCard
                key={version.versionId}
                version={version}
                isLatest={idx === 0}
                isCurrent={version.versionId === activeVersionId}
                isExpanded={expandedVersion === version.versionId}
                canRollback={!busy && version.versionId !== activeVersionId}
                onToggle={() => setExpandedVersion(
                  expandedVersion === version.versionId ? null : version.versionId
                )}
                onRollback={() => rollbackNodeVersion(node.id, version.versionId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VersionCard({
  version,
  isLatest,
  isCurrent,
  isExpanded,
  canRollback,
  onToggle,
  onRollback
}: {
  version: NodeVersion
  isLatest: boolean
  isCurrent: boolean
  isExpanded: boolean
  canRollback: boolean
  onToggle: () => void
  onRollback: () => void
}) {
  const fb = version.expertFeedback
  const color = version.passed ? 'var(--node-verified)' : 'var(--node-failed)'

  return (
    <div
      className="mb-3 rounded-xl overflow-hidden glass-panel-strong shadow-sm"
      style={{
        border: `1px solid var(--border-subtle)`
      }}
    >
      <button
        className="w-full flex items-center justify-between p-3 text-left transition-all duration-200"
        style={{ borderLeft: `3px solid ${color}` }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {version.passed
            ? <CheckCircle size={15} style={{ color: 'var(--node-verified)' }} />
            : <XCircle size={15} style={{ color: 'var(--node-failed)' }} />
          }
          <div className="flex flex-col">
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
              第 {version.attempt} 次 {isLatest && <span style={{ color: 'var(--accent-primary)' }}>(最新)</span>}
            </span>
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {new Date(version.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {version.appealReason && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 leading-none"
              style={{
                background: 'var(--danger)',
                color: 'white',
              }}
            >
              <ShieldAlert size={10} /> 已申诉
            </span>
          )}
          {isCurrent && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{
                background: 'color-mix(in srgb, var(--accent-primary), transparent 80%)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--accent-primary)'
              }}
            >
              当前
            </span>
          )}
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-md"
            style={{
              color,
              background: `color-mix(in srgb, ${color}, transparent 85%)`,
            }}
          >
            {fb.score} 分
          </span>
          {isExpanded
            ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          }
        </div>
      </button>

      {isExpanded && (
        <div
          className="px-4 pb-4 pt-2 space-y-4"
          style={{
            background: 'var(--bg-base)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* User's explanation */}
          <div>
            <p className="text-[9px] font-bold tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>讲解内容</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>{version.userExplanation}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onRollback}
              disabled={!canRollback}
              className="px-3 py-1.5 text-[10px] rounded-lg transition-all duration-200 disabled:opacity-40"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              回滚到此版本
            </button>
          </div>

          {/* Appeal Reason */}
          {version.appealReason && (
            <div
              className="p-2 rounded-lg"
              style={{
                background: 'color-mix(in srgb, var(--danger), transparent 92%)',
                border: '1px solid color-mix(in srgb, var(--danger), transparent 70%)',
              }}
            >
              <p className="text-[9px] font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                <ShieldAlert size={10} /> 申诉理由
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{version.appealReason}</p>
            </div>
          )}

          {/* Expert feedback */}
          {fb.strengths.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--node-verified)' }}>✓ 做得好</p>
              <ul className="text-xs space-y-0.5">
                {fb.strengths.map((s, i) => <li key={i} style={{ color: 'var(--text-primary)' }}>• {s}</li>)}
              </ul>
            </div>
          )}

          {fb.logicErrors.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--node-failed)' }}>✗ 逻辑错误</p>
              <ul className="text-xs space-y-0.5">
                {fb.logicErrors.map((e, i) => <li key={i} style={{ color: 'var(--text-primary)' }}>• {e}</li>)}
              </ul>
            </div>
          )}

          {fb.missingConcepts.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--node-verifying)' }}>△ 遗漏概念</p>
              <ul className="text-xs space-y-0.5">
                {fb.missingConcepts.map((c, i) => <li key={i} style={{ color: 'var(--text-primary)' }}>• {c}</li>)}
              </ul>
            </div>
          )}

          {/* Q&A history */}
          {version.studentQuestions.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>问答记录</p>
              {version.studentQuestions.map((q) => (
                <div key={q.id} className="mb-1">
                  <p className="text-xs" style={{ color: 'var(--accent-primary)' }}>小方：{q.question}</p>
                  <p className="text-xs ml-2" style={{ color: 'var(--text-primary)' }}>我：{q.userAnswer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getFailedReasonSummary(version: NodeVersion): string {
  const fb = version.expertFeedback
  if (fb.logicErrors.length > 0) return fb.logicErrors[0]
  if (fb.missingConcepts.length > 0) return `遗漏关键概念：${fb.missingConcepts[0]}`
  if (fb.misconceptions.length > 0) return `存在误解：${fb.misconceptions[0]}`
  return fb.suggestion || '需要进一步完善讲解逻辑'
}
