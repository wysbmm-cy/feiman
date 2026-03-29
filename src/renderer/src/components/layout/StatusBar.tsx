import React from 'react'
import { Save, Wifi, Loader2 } from 'lucide-react'
import { useStore } from '../../store'
import { formatDate } from '../../lib/utils'

export function StatusBar() {
  const { activeNote, isSaving, lastSaved, settings, activeNodes, activeRunNodeId, runsByNode, formulaMode } = useStore()
  const provider = settings.aiProviders.find(p => p.isDefault) ?? settings.aiProviders[0]

  const verifiedCount = activeNodes.filter(n => n.state === 'verified').length
  const totalCount = activeNodes.length
  const overallMastery = activeNote?.overallMastery

  const activeRun = activeRunNodeId ? runsByNode[activeRunNodeId] : null
  let verificationStatus = ''
  let verificationColor = 'var(--text-muted)'
  if (activeRun?.stage === 'expert_analyzing') {
    verificationStatus = '专家分析中...'
    verificationColor = 'var(--node-verifying)'
  } else if (activeRun?.stage === 'test_generating') {
    verificationStatus = '生成测试题中...'
    verificationColor = 'var(--node-verifying)'
  } else if (activeRun?.stage === 'student_solving') {
    verificationStatus = '小方做题中...'
    verificationColor = 'var(--accent-primary)'
  } else if (activeRun?.stage === 'waiting_user_answer') {
    verificationStatus = '等待回答'
    verificationColor = 'var(--node-verifying)'
  } else if (activeRun?.stage === 'final_analyzing') {
    verificationStatus = '最终判定中...'
    verificationColor = 'var(--node-verifying)'
  }

  return (
    <div
      className="flex items-center justify-between px-3 border-t flex-shrink-0 relative overflow-hidden"
      style={{
        height: 'var(--statusbar-height)',
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* Subtle gradient shimmer background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary-color), transparent 90%), transparent)',
          backgroundSize: '1000px 100%'
        }}
      />
      
      {/* Left: save status + verification */}
      <div className="flex items-center gap-3 relative z-10">
        {isSaving ? (
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <Save size={10} className="animate-pulse-accent" />
            保存中...
          </div>
        ) : lastSaved ? (
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-disabled)' }}>
            <Save size={10} />
            {formatDate(lastSaved)}
          </div>
        ) : null}

        {verificationStatus && (
          <div className="flex items-center gap-1 text-[11px]" style={{ color: verificationColor }}>
            <Loader2 size={10} className="animate-spin" />
            {verificationStatus}
          </div>
        )}

        {formulaMode.active && (
          <div
            className="flex items-center gap-1 text-[11px] font-mono font-bold"
            style={{ color: formulaMode.layer === 'formula' ? 'var(--accent-primary)' : 'var(--warning)' }}
          >
            <span
              className="px-1 py-0.5 text-[9px] tracking-wider uppercase"
              style={{
                background: formulaMode.layer === 'formula' ? 'var(--accent-muted)' : 'rgba(251, 191, 36, 0.15)',
                borderRadius: 3,
              }}
            >
              {formulaMode.layer === 'formula' ? 'FORMULA' : 'NORMAL'}
            </span>
          </div>
        )}

        {totalCount > 0 && !verificationStatus && (
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--node-verified)' }}>●</span>
            {verifiedCount}/{totalCount} 节点已掌握
            {overallMastery !== null && overallMastery !== undefined && (
              <span style={{ color: 'var(--node-verified)', marginLeft: 4 }}>
                {overallMastery}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: word count + provider */}
      <div className="flex items-center gap-3">
        {activeNote && settings.appearance.showWordCount && (
          <span className="text-[11px]" style={{ color: 'var(--text-disabled)' }}>
            {activeNote.wordCount} 字
          </span>
        )}

        {provider ? (
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-disabled)' }}>
            <Wifi size={9} style={{ color: 'var(--success)' }} />
            {provider.name}
          </div>
        ) : (
          <div className="text-[11px]" style={{ color: 'var(--danger)' }}>
            未配置 AI
          </div>
        )}
      </div>
    </div>
  )
}
