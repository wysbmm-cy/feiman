import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog'
import { AlertTriangle, MessageSquare, ThumbsDown } from 'lucide-react'
import type { ExpertFeedback } from '../../types/node.types'

interface AppealDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string, userExplanation: string) => void
  feedback: ExpertFeedback
  nodeLabel: string
}

export function AppealDialog({
  isOpen,
  onClose,
  onSubmit,
  feedback,
  nodeLabel
}: AppealDialogProps) {
  const [reason, setReason] = useState('')
  const [userExplanation, setUserExplanation] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const presetReasons = [
    { id: 'misunderstood', label: 'AI 误解了我的意思', description: '我的解释是正确的，但 AI 理解错了' },
    { id: 'too-strict', label: '验证标准过于严格', description: '对于当前学习阶段，要求过高' },
    { id: 'alternative', label: '我的方法也是正确的', description: '虽然和 AI 预期不同，但逻辑成立' },
    { id: 'context', label: '缺少上下文导致误判', description: '在特定情境下我的解释是合理的' }
  ]

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = presetReasons.find(p => p.id === presetId)
    if (preset) {
      setReason(`${preset.label}：${preset.description}`)
    }
  }

  const handleSubmit = () => {
    if (!reason.trim()) return
    onSubmit(reason, userExplanation)
    // Reset
    setReason('')
    setUserExplanation('')
    setSelectedPreset(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px'
        }}
      >
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--warning), transparent 80%)' }}
            >
              <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
            </div>
            <div>
              <DialogTitle
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                对验证结果提出申诉
              </DialogTitle>
              <DialogDescription style={{ color: 'var(--text-secondary)' }}>
                你认为 AI 对「{nodeLabel}」的验证有误？请说明原因
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* AI 原判断展示 */}
        <div
          className="rounded-lg p-4 my-4"
          style={{ background: 'color-mix(in srgb, var(--bg-elevated), transparent 50%)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown size={16} style={{ color: 'var(--danger)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              AI 的判定结果
            </span>
          </div>
          <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between">
              <span>评分：</span>
              <span style={{ color: feedback.score >= 60 ? 'var(--success)' : 'var(--danger)' }}>
                {feedback.score}/100
              </span>
            </div>
            {feedback.logicErrors.length > 0 && (
              <div>
                <span className="text-xs" style={{ color: 'var(--danger)' }}>逻辑错误：</span>
                <ul className="list-disc list-inside text-xs mt-1">
                  {feedback.logicErrors.slice(0, 2).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 快捷申诉理由 */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
            快捷选择申诉理由
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presetReasons.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-3 rounded-lg text-left text-xs transition-all border ${
                  selectedPreset === preset.id
                    ? 'border-2'
                    : 'border hover:border-opacity-50'
                }`}
                style={{
                  background: selectedPreset === preset.id
                    ? 'color-mix(in srgb, var(--accent-primary), transparent 80%)'
                    : 'var(--bg-elevated)',
                  borderColor: selectedPreset === preset.id
                    ? 'var(--accent-primary)'
                    : 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="font-medium mb-1">{preset.label}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 详细申诉说明 */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
            详细说明
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请详细说明为什么你认为 AI 的验证有误..."
            className="w-full p-3 rounded-lg text-sm resize-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              minHeight: '100px'
            }}
          />
        </div>

        {/* 补充说明输入 */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
            补充你的解释（可选）
          </label>
          <textarea
            value={userExplanation}
            onChange={(e) => setUserExplanation(e.target.value)}
            placeholder="如果你有不同的解释方式，可以在这里补充..."
            className="w-full p-3 rounded-lg text-sm resize-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              minHeight: '80px'
            }}
          />
        </div>

        <div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: 'var(--warning)',
                color: '#fff'
              }}
            >
              <MessageSquare size={16} />
              提交申诉
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
