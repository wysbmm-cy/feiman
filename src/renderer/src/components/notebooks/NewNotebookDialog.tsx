import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store'
import { useNotes } from '../../hooks/useNotes'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#60a5fa', '#f59e0b']

export function NewNotebookDialog() {
  const { newNotebookDialogOpen, setNewNotebookDialog } = useStore()
  const { createNotebook } = useNotes()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])

  if (!newNotebookDialogOpen) return null

  const handleCreate = async () => {
    if (!name.trim()) return
    await createNotebook(name.trim(), description.trim())
    setName('')
    setDescription('')
    setNewNotebookDialog(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewNotebookDialog(false)} />
      <div
        className="relative z-10 w-80 rounded-xl p-5 animate-fade-in"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>新建笔记本</h3>
          <button onClick={() => setNewNotebookDialog(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>笔记本名称 *</label>
            <input
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="例：物理学习"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>颜色标签</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: color === c ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: color === c ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${c}` : undefined
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-1.5 text-xs rounded" style={{ color: 'var(--text-muted)' }} onClick={() => setNewNotebookDialog(false)}>
            取消
          </button>
          <button
            className="px-4 py-1.5 text-xs rounded font-medium disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
