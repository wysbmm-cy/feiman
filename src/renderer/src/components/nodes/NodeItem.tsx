import React from 'react'
import type { KnowledgeNode } from '../../types/node.types'
import { NODE_TYPE_LABELS } from '../../types/node.types'

interface NodeItemProps {
  node: KnowledgeNode
  isSelected: boolean
  isLocked?: boolean
  isBusy?: boolean
  onClick: (node: KnowledgeNode) => void
  onStartVerification?: (node: KnowledgeNode) => void
  asyncResult?: { passed: boolean; message: string }
  onClearAsyncResult?: (nodeId: string) => void
}

const STATE_COLORS: Record<string, string> = {
  unverified: 'var(--node-unverified)',
  verifying: 'var(--node-verifying)',
  verified: 'var(--node-verified)',
  failed: 'var(--node-failed)',
}

export function NodeItem({ node, isSelected, isLocked, isBusy, onClick, onStartVerification, asyncResult, onClearAsyncResult }: NodeItemProps) {
  const isVerifying = node.state === 'verifying'
  const isFailed = node.state === 'failed'
  const isVerified = node.state === 'verified'

  // 动态掌握度颜色计算 (从黄色到绿色的过渡)
  const getMasteryColor = (score: number = 0) => {
    if (score < 60) return 'var(--node-failed)';
    if (score < 80) return '#eab308'; // yellow-500
    if (score < 95) return '#22c55e'; // green-500
    return '#10b981'; // emerald-500
  }

  const stateColor = isVerified && node.masteryScore != null 
    ? getMasteryColor(node.masteryScore) 
    : (STATE_COLORS[node.state] || 'var(--accent-primary)')

  const isMastered = isVerified && (node.masteryScore || 0) >= 95;

  const actionable = !isLocked && !isBusy
  let containerClasses = `node-container absolute flex items-center transform -translate-x-1/2 -translate-y-1/2 group ${actionable ? 'cursor-pointer' : 'cursor-not-allowed'}`
  if (isSelected) containerClasses += ' node-active'

  return (
    <foreignObject
      x={node.position.x - 100}
      y={node.position.y - 40}
      width={200}
      height={80}
      style={{ overflow: 'visible' }}
    >
      <div
        className={containerClasses}
        onClick={(e) => {
          if (actionable) {
            e.stopPropagation()
            onClick(node)
          }
        }}
        style={{ left: '50%', top: '50%' }}
      >
        {/* Node dot indicator */}
        <div
          className={`relative z-20 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center -mr-3 transition-all duration-300 ${actionable && 'group-hover:scale-110'} ${isVerifying ? 'animate-pulse-accent' : ''} ${isMastered ? 'animate-pulse-mastery' : ''}`}
          style={{
            background: `color-mix(in srgb, ${stateColor}, transparent 80%)`,
            border: `2px solid ${stateColor}`,
            boxShadow: isSelected || isMastered ? `0 0 15px color-mix(in srgb, ${stateColor}, transparent 50%)` : 'none',
          }}
        >
          {isLocked ? (
            <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <span className="text-xs font-bold" style={{ color: stateColor }}>
              {NODE_TYPE_LABELS[node.type]?.[0] || '●'}
            </span>
          )}
        </div>

        {/* Node label card */}
        <div
          className={`relative rounded-xl pl-5 pr-4 py-1.5 min-w-[110px] transition-all duration-300 glass-panel shadow-md ${(isLocked || isBusy) ? 'opacity-60 blur-[1px]' : 'group-hover:shadow-xl'}`}
          style={{
            borderColor: isSelected ? stateColor : 'var(--border-strong)',
            borderWidth: isSelected ? '2px' : '1px',
            boxShadow: isSelected ? `0 6px 16px color-mix(in srgb, ${stateColor}, transparent 60%)` : undefined,
          }}
        >
          {/* Type badge */}
          <div
            className="absolute -top-2.5 left-3 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1"
            style={{
              background: isFailed ? 'var(--node-failed)' : 'var(--bg-overlay)',
              color: isFailed ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${isFailed ? 'var(--node-failed)' : 'var(--border-subtle)'}`,
            }}
          >
            {NODE_TYPE_LABELS[node.type]}
            {node.masteryScore != null && ` · ${node.masteryScore}`}
          </div>

          <div
            className="font-bold text-base leading-tight mt-1 whitespace-nowrap"
            style={{ color: 'var(--text-primary)' }}
          >
            {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
          </div>

          {/* Async Result Toast */}
          {asyncResult && (
            <div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded shadow text-[10px] whitespace-nowrap z-50 flex items-center gap-1 cursor-pointer animate-fade-in"
              style={{
                background: asyncResult.passed ? 'var(--node-verified)' : 'var(--node-failed)',
                color: 'white',
              }}
              onClick={(e) => {
                e.stopPropagation()
                onClearAsyncResult?.(node.id)
              }}
            >
              {asyncResult.passed ? '✓' : '✗'} {asyncResult.message}
            </div>
          )}

          {/* Quick action */}
          {isSelected && !isLocked && !isBusy && (node.state === 'unverified' || node.state === 'failed') && onStartVerification && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartVerification(node) }}
              className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] px-3 py-0.5 rounded-lg whitespace-nowrap transition-all duration-200 hover:opacity-80"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--accent-foreground)',
              }}
            >
              开始验证
            </button>
          )}
        </div>
      </div>
    </foreignObject>
  )
}

/** Inline node indicator for Cornell Cues area */
export function NodeIndicator({ state }: { state: KnowledgeNode['state'] }) {
  const color = STATE_COLORS[state] || 'var(--accent-primary)'
  const icons: Record<string, string> = {
    verified: '✓',
    failed: '✗',
    verifying: '◎',
    unverified: '○',
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ml-1 flex-shrink-0 ${state === 'verifying' ? 'animate-pulse-accent' : ''}`}
      style={{
        color,
        background: `color-mix(in srgb, ${color}, transparent 85%)`,
        border: `1px solid ${color}`,
      }}
      title={`节点状态: ${state}`}
    >
      {icons[state] || '○'}
    </span>
  )
}
