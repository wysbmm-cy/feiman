import React, { useState } from 'react'
import { Minus, Square, X, BookOpen, Settings, MessageSquare, Keyboard, HelpCircle } from 'lucide-react'
import { useStore } from '../../store'
import { useElectron } from '../../hooks/useElectron'
import { cn } from '../../lib/utils'
import { ModeToggle } from '../mode/ModeToggle'
import { UserGuideModal } from '../help/UserGuideModal'

export function TitleBar() {
  const { activeView, setActiveView, setSettingsOpen, toggleStudentPanel, studentPanelOpen, activeNote, resetTutorial } = useStore()
  const api = useElectron()
  const [userGuideOpen, setUserGuideOpen] = useState(false)

  return (
    <div
      className="flex items-center h-[40px] border-b select-none flex-shrink-0"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}
    >
      {/* App logo */}
      <div
        className="flex items-center gap-2 px-4 h-full"
        style={{ minWidth: 'var(--sidebar-width)' }}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--accent-primary)', color: 'var(--accent-foreground)' }}
        >
          F
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Anything Feynman
        </span>
      </div>

      {/* Navigation + active note title */}
      <div
        className="flex items-center gap-2 h-full px-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => setActiveView('editor')}
          className={cn(
            'flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-all duration-200'
          )}
          style={{
            background: activeView === 'editor'
              ? 'var(--accent-primary)'
              : 'color-mix(in srgb, var(--primary-color), transparent 92%)',
            color: activeView === 'editor' ? 'var(--accent-foreground)' : 'var(--text-secondary)'
          }}
        >
          <BookOpen size={13} />
          编辑器
        </button>

        {activeNote && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {activeNote.title}
          </span>
        )}
      </div>

      {/* Spacer (draggable) */}
      <div className="flex-1" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Mode Toggle - C++ 模式切换 */}
      <div 
        className="flex items-center h-full px-2" 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <ModeToggle />
      </div>

      {/* Settings + Student Panel toggle + Window controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          data-tutorial="student-panel"
          onClick={toggleStudentPanel}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          style={{
            color: studentPanelOpen ? 'var(--accent-primary)' : 'var(--text-muted)',
            background: studentPanelOpen ? 'var(--accent-muted)' : undefined
          }}
          title="小方学生面板 (Ctrl+\)"
        >
          <MessageSquare size={14} />
        </button>
        <button
          data-tutorial="help-button"
          onClick={() => setUserGuideOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
          title="使用指导"
        >
          <HelpCircle size={14} />
        </button>
        <button
          data-tutorial="settings"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
          title="设置"
        >
          <Settings size={14} />
        </button>

        {api && (
          <>
            <button
              onClick={() => api.minimize()}
              className="flex items-center justify-center w-9 h-9 transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              <Minus size={12} />
            </button>
            <button
              onClick={() => api.maximize()}
              className="flex items-center justify-center w-9 h-9 transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              <Square size={10} />
            </button>
            <button
              onClick={() => api.close()}
              className="flex items-center justify-center w-9 h-9 hover:bg-red-500/80 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={12} />
            </button>
          </>
        )}
      </div>

      {/* User Guide Modal */}
      <UserGuideModal open={userGuideOpen} onClose={() => setUserGuideOpen(false)} />
    </div>
  )
}
