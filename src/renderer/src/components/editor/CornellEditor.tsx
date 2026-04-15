import React from 'react'
import { NoteHeader } from './NoteHeader'
import { EditorToolbar } from './EditorToolbar'
import { CornellLayout } from './CornellLayout'
import { FormulaOverlay } from './FormulaOverlay'
import { useStore } from '../../store'
import { useNotes } from '../../hooks/useNotes'

export function CornellEditor() {
  const { activeNote } = useStore()
  const { updateContent } = useNotes()

  if (!activeNote) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="text-center">
          <p className="text-sm">从侧边栏选择或新建一篇笔记</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <NoteHeader />
      <EditorToolbar />
      <div className="flex-1 overflow-hidden">
        <CornellLayout
          cues={activeNote.cornell.cues}
          notes={activeNote.cornell.notes}
          summary={activeNote.cornell.summary}
          onCuesChange={(cues) => updateContent({ cues })}
          onNotesChange={(notes) => updateContent({ notes })}
          onSummaryChange={(summary) => updateContent({ summary })}
        />
      </div>
      <FormulaOverlay />
    </div>
  )
}
