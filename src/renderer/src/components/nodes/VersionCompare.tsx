import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, GitCompare, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { KnowledgeNode, NodeVersion } from '../../types/node.types'

interface VersionCompareProps {
  node: KnowledgeNode
  isOpen: boolean
  onClose: () => void
}

export function VersionCompare({ node, isOpen, onClose }: VersionCompareProps) {
  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([
    Math.max(0, node.versions.length - 2),
    Math.max(0, node.versions.length - 1)
  ])

  if (!isOpen || node.versions.length < 1) return null

  const versionA = node.versions[selectedVersions[0]]
  const versionB = node.versions[selectedVersions[1]]

  const handleVersionSelect = (index: number, side: 'left' | 'right') => {
    const otherSide = side === 'left' ? selectedVersions[1] : selectedVersions[0]
    if (index === otherSide) return // Can't compare same version
    
    setSelectedVersions(prev => 
      side === 'left' ? [index, prev[1]] : [prev[0], index]
    )
  }

  const renderDiff = (textA: string, textB: string) => {
    if (textA === textB) {
      return <span className="text-gray-500 italic">无变化</span>
    }
    return (
      <div className="space-y-1">
        {textA !== textB && (
          <>
            <div className="text-red-600 line-through bg-red-50 px-2 py-1 rounded text-sm">
              {textA || '(空)'}
            </div>
            <div className="text-green-600 bg-green-50 px-2 py-1 rounded text-sm">
              {textB || '(空)'}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-xl shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b sticky top-0"
          style={{ 
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex items-center gap-3">
            <GitCompare size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              版本对比
            </h2>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {node.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Version Selector */}
        <div 
          className="p-4 border-b grid grid-cols-2 gap-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Left Side */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
              旧版本
            </label>
            <div className="flex flex-wrap gap-2">
              {node.versions.map((v, i) => (
                <button
                  key={v.versionId}
                  onClick={() => handleVersionSelect(i, 'left')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedVersions[0] === i
                      ? 'ring-2'
                      : 'hover:opacity-70'
                  }`}
                  style={{
                    background: selectedVersions[0] === i
                      ? 'color-mix(in srgb, var(--accent-primary), transparent 80%)'
                      : 'var(--bg-elevated)',
                    color: selectedVersions[0] === i
                      ? 'var(--accent-primary)'
                      : 'var(--text-secondary)'
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {v.passed ? (
                      <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                    ) : (
                      <XCircle size={12} style={{ color: 'var(--danger)' }} />
                    )}
                    v{v.attempt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
              新版本
            </label>
            <div className="flex flex-wrap gap-2">
              {node.versions.map((v, i) => (
                <button
                  key={v.versionId}
                  onClick={() => handleVersionSelect(i, 'right')}
                  disabled={i === selectedVersions[0]}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    selectedVersions[1] === i
                      ? 'ring-2'
                      : 'hover:opacity-70'
                  }`}
                  style={{
                    background: selectedVersions[1] === i
                      ? 'color-mix(in srgb, var(--accent-primary), transparent 80%)'
                      : 'var(--bg-elevated)',
                    color: selectedVersions[1] === i
                      ? 'var(--accent-primary)'
                      : 'var(--text-secondary)'
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {v.passed ? (
                      <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                    ) : (
                      <XCircle size={12} style={{ color: 'var(--danger)' }} />
                    )}
                    v{v.attempt}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(versionA.createdAt).toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                    用户解释
                  </span>
                  <div className="text-sm p-2 rounded bg-black/5" style={{ color: 'var(--text-primary)' }}>
                    {versionA.userExplanation}
                  </div>
                </div>

                {versionA.studentQuestions.length > 0 && (
                  <div>
                    <span className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                      问答记录
                    </span>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {versionA.studentQuestions.length} 轮问答
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  {versionA.passed ? (
                    <>
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                        通过 ({versionA.expertFeedback.score}分)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} style={{ color: 'var(--danger)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                        未通过 ({versionA.expertFeedback.score}分)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(versionB.createdAt).toLocaleString()}
                </span>
              </div>

              {/* 差异对比 */}
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                    用户解释
                  </span>
                  {renderDiff(versionA.userExplanation, versionB.userExplanation)}
                </div>

                <div>
                  <span className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                    评分变化
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: versionA.passed ? 'var(--success)' : 'var(--danger)' }}>
                      {versionA.expertFeedback.score}
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm font-medium" style={{ color: versionB.passed ? 'var(--success)' : 'var(--danger)' }}>
                      {versionB.expertFeedback.score}
                    </span>
                    {versionB.expertFeedback.score > versionA.expertFeedback.score && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        +{versionB.expertFeedback.score - versionA.expertFeedback.score}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  {versionB.passed ? (
                    <>
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                        通过
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} style={{ color: 'var(--danger)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                        未通过
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
