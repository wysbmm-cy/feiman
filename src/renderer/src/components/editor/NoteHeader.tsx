import React, { useState } from 'react'
import { Tag, X, Plus } from 'lucide-react'
import { useStore } from '../../store'
import { useNotes } from '../../hooks/useNotes'

export function NoteHeader() {
  const { activeNote, updateNoteTitle, updateNoteTopic, updateNoteTags } = useStore()
  const { saveNote } = useNotes()
  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)

  if (!activeNote) return null

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNoteTitle(e.target.value)
  }

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNoteTopic(e.target.value)
  }

  const addTag = () => {
    if (!newTag.trim()) return
    const tags = [...(activeNote.tags || []), newTag.trim()]
    updateNoteTags(tags)
    setNewTag('')
    setShowTagInput(false)
  }

  const removeTag = (tag: string) => {
    updateNoteTags(activeNote.tags.filter((t) => t !== tag))
  }

  return (
    <div
      className="border-b px-4 py-3 flex-shrink-0"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Title */}
      <input
        className="w-full text-xl font-bold bg-transparent outline-none"
        style={{ color: 'var(--text-primary)' }}
        value={activeNote.title}
        onChange={handleTitleChange}
        onBlur={() => saveNote && activeNote && saveNote(activeNote)}
        placeholder="笔记标题..."
      />

      {/* Topic + tags row */}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <input
          className="text-xs bg-transparent outline-none border-b border-dashed"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', minWidth: 80 }}
          value={activeNote.topic}
          onChange={handleTopicChange}
          onBlur={() => saveNote && activeNote && saveNote(activeNote)}
          placeholder="主题领域..."
        />

        <div className="w-px h-3 mx-1" style={{ background: 'var(--border-subtle)' }} />

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          <Tag size={11} style={{ color: 'var(--text-muted)' }} />
          {(activeNote.tags || []).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px]"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-0.5">
                <X size={9} />
              </button>
            </span>
          ))}

          {showTagInput ? (
            <input
              autoFocus
              className="text-xs bg-transparent outline-none border-b border-dashed w-20"
              style={{ borderColor: 'var(--accent-primary)', color: 'var(--text-primary)' }}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setShowTagInput(false) }}
              onBlur={() => { addTag(); setShowTagInput(false) }}
              placeholder="新标签"
            />
          ) : (
            <button
              className="flex items-center gap-0.5 text-[11px] hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setShowTagInput(true)}
            >
              <Plus size={10} />
              标签
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
