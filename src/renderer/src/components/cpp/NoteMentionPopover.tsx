import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'
import { FileText, Search } from 'lucide-react'
import type { NoteMetadata } from '../../types'

interface NoteMentionPopoverProps {
  onSelect: (note: NoteMetadata) => void
  onClose: () => void
  filter: string
}

export function NoteMentionPopover({ onSelect, onClose, filter }: NoteMentionPopoverProps) {
  const { notes } = useStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const allNotes = Object.values(notes)
  const filteredNotes = allNotes.filter(n => 
    n.title.toLowerCase().includes(filter.toLowerCase()) ||
    n.topic.toLowerCase().includes(filter.toLowerCase())
  ).slice(0, 10)

  useEffect(() => {
    setSelectedIndex(0)
  }, [filter])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredNotes.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredNotes.length) % Math.max(1, filteredNotes.length))
      } else if (e.key === 'Enter') {
        if (filteredNotes[selectedIndex]) {
          e.preventDefault()
          onSelect(filteredNotes[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredNotes, selectedIndex, onSelect, onClose])

  if (filteredNotes.length === 0) return null

  return (
    <div 
      className="absolute bottom-full mb-2 left-0 w-64 bg-[#1c2128] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200"
      style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
    >
      <div className="px-3 py-2 border-b border-gray-700/50 bg-[#161b22] flex items-center gap-2">
        <Search size={12} className="text-gray-500" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">关联笔记页面</span>
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {filteredNotes.map((note, index) => (
          <button
            key={note.id}
            onClick={() => onSelect(note)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
              index === selectedIndex ? 'bg-blue-500/20 text-blue-400 shadow-inner' : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'bg-blue-500/20' : 'bg-gray-800'}`}>
              <FileText size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{note.title}</div>
              <div className="text-[10px] opacity-50 truncate">{note.topic || '未分类'}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
