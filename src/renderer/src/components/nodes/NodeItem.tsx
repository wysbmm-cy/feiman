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
  unverified: '#6b7280',
  verifying: '#f59e0b',
  verified: '#10b981',
  failed: '#ef4444',
}

export function NodeItem({ node, isSelected, isLocked, isBusy, onClick, onStartVerification, asyncResult, onClearAsyncResult }: NodeItemProps) {
  const isVerifying = node.state === 'verifying'
  const isFailed = node.state === 'failed'
  const isVerified = node.state === 'verified'

  // 动态掌握度颜色计算
  const getMasteryColor = (score: number = 0) => {
    if (score < 60) return '#ef4444';
    if (score < 80) return '#eab308';
    if (score < 95) return '#22c55e';
    return '#10b981';
  }

  const stateColor = isVerified && node.masteryScore != null 
    ? getMasteryColor(node.masteryScore) 
    : (STATE_COLORS[node.state] || 'var(--primary-color)')

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
        {/* Hexagon icon for core nodes, circle for sub nodes */}
        <div
          className={`relative z-20 flex-shrink-0 transition-transform duration-300 -mr-3 ${actionable && 'group-hover:scale-110'} ${isVerifying ? 'animate-pulse-accent' : ''} ${isMastered ? 'animate-pulse-mastery' : ''}`}
          style={{
            filter: `drop-shadow(0 0 8px ${stateColor}80)`,
          }}
        >
          {node.type === 'core' ? (
            // Hexagon icon
            <svg width="42" height="42" viewBox="0 0 100 100" style={{ color: stateColor }}>
              <polygon points="50,4 96,26 96,74 50,96 4,74 4,26" fill="currentColor" />
            </svg>
          ) : (
            // Circle play icon
            <svg width="38" height="38" viewBox="0 0 100 100" style={{ color: '#71717a' }}>
              <circle cx="50" cy="50" r="48" fill="currentColor" />
              <polygon points="40,30 70,50 40,70" fill="#111" />
            </svg>
          )}
        </div>

        {/* Node label card - tech style white card */}
        <div
          className={`relative node-card pl-[22px] pr-5 py-1 min-w-[120px] ${(isLocked || isBusy) ? 'opacity-60' : ''}`}
        >
          {/* Type badge */}
          <div className="node-tag">
            <span></span>
            {NODE_TYPE_LABELS[node.type]}
            {node.masteryScore != null && ` · ${node.masteryScore}`}
          </div>

          <div
            className="font-bold text-[24px] leading-none tracking-wider mt-1 whitespace-nowrap"
            style={{ color: '#111' }}
          >
            {node.label.length > 8 ? node.label.slice(0, 7) + '…' : node.label}
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
              className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] px-3 py-0.5 rounded whitespace-nowrap transition-all duration-200 hover:opacity-80 clip-corner"
              style={{
                background: 'var(--primary-color)',
                color: 'white',
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
  const color = STATE_COLORS[state] || 'var(--primary-color)'
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
