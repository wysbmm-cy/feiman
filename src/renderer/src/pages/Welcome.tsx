import React from 'react'
import { BookOpen, Zap, GitBranch, Plus } from 'lucide-react'
import { useStore } from '../store'

export function Welcome() {
  const { notebooks, setNewNoteDialog, setNewNotebookDialog, setSettingsOpen, settings } = useStore()
  const hasProvider = settings.aiProviders.length > 0

  return (
    <div className="flex flex-col items-center justify-center h-full p-8" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6"
          style={{ background: 'var(--accent-primary)', color: '#fff' }}
        >
          F
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          费曼学习法 AI 助手
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          通过记录、解释、评估和精炼，实现真正的深层理解
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: BookOpen, label: '康奈尔笔记', desc: '结构化的三区域笔记格式', color: 'var(--phase-study)' },
            { icon: Zap, label: '费曼工作流', desc: '六阶段 AI 引导学习法', color: 'var(--phase-explain)' },
            { icon: GitBranch, label: '知识图谱', desc: 'AI 自动关联知识节点', color: 'var(--phase-socratic)' }
          ].map(({ icon: Icon, label, desc, color }) => (
            <div
              key={label}
              className="p-4 rounded-xl border text-left"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <Icon size={20} style={{ color, marginBottom: 8 }} />
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2">
          {!hasProvider && (
            <button
              className="w-full py-2.5 rounded-xl text-sm font-medium border-2"
              style={{ borderColor: 'var(--warning)', color: 'var(--warning)', background: 'transparent' }}
              onClick={() => setSettingsOpen(true)}
            >
              ⚠️ 请先配置 AI 模型（设置）
            </button>
          )}

          {notebooks.length === 0 ? (
            <button
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent-primary)', color: '#fff' }}
              onClick={() => setNewNotebookDialog(true)}
            >
              <Plus size={16} className="inline mr-1.5" />
              创建第一个笔记本
            </button>
          ) : (
            <button
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent-primary)', color: '#fff' }}
              onClick={() => setNewNoteDialog(true)}
            >
              <Plus size={16} className="inline mr-1.5" />
              新建笔记，开始学习
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
