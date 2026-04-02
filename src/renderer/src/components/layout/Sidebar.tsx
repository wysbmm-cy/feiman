import React, { useState, useEffect, useCallback } from 'react'
import {
  ChevronRight, ChevronDown, Plus, FolderOpen, FileText,
  Search, Trash2, BookOpen, FileCode, Brain,
  Database, Upload, FilePlus, File, AlertCircle
} from 'lucide-react'
import { useStore } from '../../store'
import { useNotes } from '../../hooks/useNotes'
import { cn } from '../../lib/utils'
import type { Notebook, NoteMetadata } from '../../types'
import { RecallChallenge } from '../student/RecallChallenge'
import type { RagFileEntry } from '../../../../shared/ipc-types'

// ————— Knowledge Base Section —————

function KnowledgeBaseSection({ notebookId }: { notebookId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [files, setFiles] = useState<RagFileEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFiles = useCallback(async () => {
    const api = (window as any).electronAPI
    if (!api?.ragListFiles) return
    const res = await api.ragListFiles(notebookId)
    if (res?.success && Array.isArray(res.data)) setFiles(res.data)
  }, [notebookId])

  useEffect(() => {
    if (expanded) loadFiles()
  }, [expanded, loadFiles])

  const handleUpload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const api = (window as any).electronAPI
    if (!api?.ragUploadFile || uploading) return
    setError(null)
    setUploading(true)
    try {
      const res = await api.ragUploadFile(notebookId)
      if (res?.success && res.data) {
        setFiles((prev) => [...prev, res.data as RagFileEntry])
        if (!expanded) setExpanded(true)
      } else if (res?.error) {
        setError(res.error)
        // Auto-clear error after 5 seconds
        setTimeout(() => setError(null), 5000)
      }
    } catch (err) {
      setError('上传失败，请重试')
      setTimeout(() => setError(null), 5000)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation()
    const api = (window as any).electronAPI
    if (!api?.ragDeleteFile) return
    await api.ragDeleteFile(fileId)
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const fmt = (b: number) =>
    b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1048576).toFixed(1)}MB`

  return (
    <div className="mb-0.5">
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer group transition-all duration-150 select-none"
        onClick={() => setExpanded(!expanded)}
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-color), transparent 93%)'}
        onMouseLeave={(e) => e.currentTarget.style.background = ''}
      >
        <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </div>
        <Database size={10} className="flex-shrink-0" style={{ color: 'var(--accent-secondary, #8b5cf6)' }} />
        <span className="text-[10px] font-medium flex-1" style={{ color: 'var(--text-muted)' }}>
          {'知识库'}{files.length > 0 ? ` (${files.length})` : ''}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded transition-all duration-150"
          style={{ color: 'var(--accent-secondary, #8b5cf6)' }}
          onClick={handleUpload}
          title="upload"
          disabled={uploading}
        >
          {uploading ? <span className="text-[8px] animate-pulse">...</span> : <Upload size={9} />}
        </button>
      </div>

      {expanded && (
        <div className="ml-4">
          {/* Error message */}
          {error && (
            <div className="text-[10px] px-2 py-1.5 mb-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1">
              <AlertCircle size={10} />
              {error}
            </div>
          )}
          
          {files.length === 0 ? (
            <div
              className="text-[10px] px-2 py-2 italic flex items-center gap-1.5 cursor-pointer rounded-md transition-all duration-150"
              style={{ color: 'var(--text-disabled)' }}
              onClick={handleUpload}
              onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-color), transparent 93%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}
            >
              <FilePlus size={10} />
              {'PDF / TXT / MD 上传到知识库'}
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md group transition-all duration-150"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-color), transparent 93%)'}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
              >
                <File size={10} style={{ color: 'var(--accent-secondary, #8b5cf6)', flexShrink: 0 }} />
                <span className="text-[10px] flex-1 truncate" title={file.fileName}>
                  {file.fileName}
                </span>
                <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--text-disabled)' }}>
                  {fmt(file.fileSizeBytes)}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded transition-all duration-150"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={(e) => handleDelete(e, file.id)}
                  title="remove"
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = ''}
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ————— Note Item —————

function NoteItem({
  note,
  isActive,
  onClick
}: {
  note: NoteMetadata
  isActive: boolean
  onClick: () => void
}) {
  const { deleteNote } = useNotes()

  return (
    <div
      className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-all duration-200')}
      style={{ background: isActive ? 'var(--accent-muted)' : undefined }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-color), transparent 92%)' }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = '' }}
      onClick={onClick}
    >
      <FileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span
        className="text-xs flex-1 truncate"
        style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
      >
        {note.title || '无标题'}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded transition-opacity"
        style={{ color: 'var(--text-muted)' }}
        onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
        title="delete"
      >
        <Trash2 size={10} />
      </button>
    </div>
  )
}

// ————— Notebook Item —————

function NotebookItem({ notebook, notes }: { notebook: Notebook; notes: NoteMetadata[] }) {
  const [expanded, setExpanded] = useState(true)
  const [notesExpanded, setNotesExpanded] = useState(true)
  const { activeNoteId, setNewNoteDialog, setActiveView } = useStore()
  const { loadNote } = useNotes()

  const handleNoteClick = async (noteId: string) => {
    await loadNote(noteId)
    setActiveView('editor')
  }

  return (
    <div className="mb-1">
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group transition-all duration-200"
        onClick={() => setExpanded(!expanded)}
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-color), transparent 90%)'}
        onMouseLeave={(e) => e.currentTarget.style.background = ''}
      >
        <div className="w-3 h-3 flex items-center justify-center">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: notebook.color || 'var(--accent-primary)' }}
        />
        <span className="text-xs font-medium flex-1 truncate">{notebook.name}</span>
        <button
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-md transition-opacity"
          onClick={(e) => { e.stopPropagation(); setNewNoteDialog(true, notebook.id) }}
          title="new note"
          style={{ color: 'var(--accent-primary)' }}
        >
          <Plus size={11} />
        </button>
      </div>

      {expanded && (
        <div className="ml-4 space-y-0.5">
          <div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer group transition-all duration-150 select-none"
              onClick={() => setNotesExpanded(!notesExpanded)}
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-color), transparent 93%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}
            >
              <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                {notesExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              </div>
              <FileText size={10} className="flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-[10px] font-medium flex-1" style={{ color: 'var(--text-muted)' }}>
              {'笔记'} ({notes.length})
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded transition-opacity"
                onClick={(e) => { e.stopPropagation(); setNewNoteDialog(true, notebook.id) }}
                title="new note"
                style={{ color: 'var(--accent-primary)' }}
              >
                <Plus size={9} />
              </button>
            </div>

            {notesExpanded && (
              <div className="ml-4">
                {notes.length === 0 ? (
                  <div className="text-[10px] px-2 py-2 italic" style={{ color: 'var(--text-muted)' }}>
                    暂无笔记
                  </div>
                ) : (
                  notes.map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      isActive={activeNoteId === note.id}
                      onClick={() => handleNoteClick(note.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <KnowledgeBaseSection notebookId={notebook.id} />
        </div>
      )}
    </div>
  )
}

// ————— Sidebar —————

export function Sidebar() {
  const {
    notebooks, notes,
    setNewNotebookDialog, setNewNoteDialog,
    mode, cppFiles, activeCppFileId, addCppFile, deleteCppFile, setActiveCppFileId,
    setActiveView, activeNodes
  } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [recallNode, setRecallNode] = useState<string | null>(null)

  const isCpp = mode === 'cpp'

  const filteredNotes = Object.values(notes).filter((n) =>
    !searchQuery ||
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      data-tutorial="sidebar"
      className="flex flex-col h-full border-r flex-shrink-0 glass-panel"
      style={{ width: 'var(--sidebar-width)', borderRight: '1px solid var(--border-strong)' }}
    >
      <div className="p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200"
          style={{ background: 'color-mix(in srgb, var(--bg-elevated), transparent 20%)', border: '1px solid var(--border-subtle)' }}
        >
          <Search size={12} style={{ color: 'var(--text-muted)' }} />
          <input
            className="flex-1 text-xs bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isCpp ? (
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
              {'C++ 代码库'} ({cppFiles.length})
            </div>
            {cppFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-2 text-center opacity-40">
                <FileCode size={32} className="mb-2" />
                <p className="text-[10px]">快写一行 Hello World 吧</p>
              </div>
            ) : (
              cppFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-all duration-200',
                    activeCppFileId === file.id ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400 hover:bg-gray-800/30'
                  )}
                  onClick={() => { setActiveCppFileId(file.id); setActiveView('editor') }}
                >
                  <FileCode size={12} className={activeCppFileId === file.id ? 'text-blue-400' : 'text-gray-500'} />
                  <span className="text-xs flex-1 truncate">{file.name}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                    onClick={(e) => { e.stopPropagation(); deleteCppFile(file.id) }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : searchQuery ? (
          <div>
            <div className="text-xs px-2 mb-2" style={{ color: 'var(--text-muted)' }}>
              ({filteredNotes.length})
            </div>
            {filteredNotes.map((note) => (
              <NoteItem key={note.id} note={note} isActive={false} onClick={() => {}} />
            ))}
          </div>
        ) : notebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <BookOpen size={24} style={{ color: 'var(--text-disabled)' }} />
            <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>暂无笔记本</p>
            </div>
          </div>
        ) : (
          notebooks.map((nb: Notebook) => {
            const nbNotes = nb.noteIds
              .map((id: string) => notes[id])
              .filter(Boolean) as NoteMetadata[]
            return <NotebookItem key={nb.id} notebook={nb} notes={nbNotes} />
          })
        )}
      </div>

      {!isCpp && activeNodes.some(n => n.state === 'verified') && (
        <div className="px-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => {
              const verified = activeNodes.filter(n => n.state === 'verified')
              const rand = verified[Math.floor(Math.random() * verified.length)]
              setRecallNode(rand.label)
            }}
            className="w-full h-12 rounded-xl flex items-center gap-3 px-3 transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
              <Brain size={16} />
            </div>
            <div className="text-left overflow-hidden">
              <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">记忆宫殿</div>
              <div className="text-xs text-gray-400 truncate">进入主动回忆环节</div>
            </div>
          </button>
        </div>
      )}

      {recallNode && (
        <RecallChallenge
          nodeLabel={recallNode}
          onClose={() => setRecallNode(null)}
          onComplete={(score) => { console.log('score:', score) }}
        />
      )}

      <div className="p-2 border-t flex gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
        {isCpp ? (
          <button
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all duration-200"
            style={{ background: 'color-mix(in srgb, var(--accent-primary), transparent 80%)', color: 'var(--accent-primary)' }}
            onClick={() => { addCppFile(); setActiveView('editor') }}
          >
            <Plus size={12} />
            new C++ file
          </button>
        ) : (
          <>
            <button
              data-tutorial="new-notebook"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-color), transparent 90%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}
              onClick={() => setNewNotebookDialog(true)}
            >
              <FolderOpen size={12} />
              新建笔记本
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all duration-200"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}
              onClick={() => setNewNoteDialog(true)}
              disabled={notebooks.length === 0}
            >
              <Plus size={12} />
              new note
            </button>
          </>
        )}
      </div>
    </div>
  )
}