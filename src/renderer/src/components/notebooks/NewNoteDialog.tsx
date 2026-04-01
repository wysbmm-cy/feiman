import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store'
import { useNotes } from '../../hooks/useNotes'

export function NewNoteDialog() {
  const { newNoteDialogOpen, newNoteNotebookId, notebooks, setNewNoteDialog, setActiveView } = useStore()
  const { createNote } = useNotes()
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [notebookId, setNotebookId] = useState('')

  useEffect(() => {
    if (newNoteDialogOpen) {
      setNotebookId(newNoteNotebookId || notebooks[0]?.id || '')
      setTitle('')
      setTopic('')
    }
  }, [newNoteDialogOpen, newNoteNotebookId, notebooks])

  if (!newNoteDialogOpen) return null

  const handleCreate = async () => {
    if (!title.trim() || !notebookId) return
    await createNote(notebookId, title.trim(), topic.trim() || title.trim())
    setTitle('')
    setTopic('')
    setNewNoteDialog(false)
    setActiveView('editor')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewNoteDialog(false)} />
      <div
        className="relative z-10 w-80 rounded-xl p-5 animate-fade-in"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>新建笔记</h3>
          <button onClick={() => setNewNoteDialog(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>笔记标题 *</label>
            <input
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="例：牛顿运动定律"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>主题领域</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="例：物理 / 经济学 / 计算机科学"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>所属笔记本</label>
            <select
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              value={notebookId}
              onChange={(e) => setNotebookId(e.target.value)}
            >
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>{nb.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-1.5 text-xs rounded" style={{ color: 'var(--text-muted)' }} onClick={() => setNewNoteDialog(false)}>
            取消
          </button>
          <button
            className="px-4 py-1.5 text-xs rounded font-medium disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
            onClick={handleCreate}
            disabled={!title.trim() || !notebookId}
          >
            创建笔记
          </button>
        </div>
      </div>
    </div>
  )
}
