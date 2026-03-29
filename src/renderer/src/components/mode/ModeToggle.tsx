import React from 'react'
import { useStore } from '../../store'
import { Terminal, BookOpen } from 'lucide-react'

export function ModeToggle() {
  const mode = useStore(state => state.mode)
  const toggleMode = useStore(state => state.toggleMode)
  const isCpp = mode === 'cpp'
  const setActiveView = useStore(state => state.setActiveView)

  const handleToggle = () => {
    const nextMode = isCpp ? 'general' : 'cpp'
    toggleMode()
    if (nextMode === 'cpp') {
      setActiveView('editor')
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300"
      style={{
        background: isCpp
          ? 'linear-gradient(135deg, #1a365d, #2c5282)'
          : 'var(--bg-elevated)',
        color: isCpp ? '#bee3f8' : 'var(--text-secondary)',
        border: `1px solid ${isCpp ? '#3182ce' : 'var(--border-subtle)'}`,
        boxShadow: isCpp ? '0 0 15px rgba(49, 130, 206, 0.3)' : 'none'
      }}
    >
      {isCpp ? <Terminal size={16} /> : <BookOpen size={16} />}
      <span>{isCpp ? 'C++ 模式' : '通用模式'}</span>
    </button>
  )
}
