import React, { useEffect, useCallback, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { SmartEditor } from './pages/SmartEditor'
import { Welcome } from './pages/Welcome'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { NewNoteDialog } from './components/notebooks/NewNoteDialog'
import { NewNotebookDialog } from './components/notebooks/NewNotebookDialog'
import { CppLearningMode } from './components/cpp/CppLearningMode'
import { CodeLearningMode } from './components/code/CodeLearningMode'
import { ErrorBoundary } from './components/error/ErrorBoundary'
import { ToastContainer } from './components/toast/ToastContainer'
import { KeyboardShortcutsModal } from './components/help/KeyboardShortcutsModal'
import { useStore } from './store'
import { useElectron } from './hooks/useElectron'
import { useTheme } from './hooks/useTheme'
import { enterFormulaModeEffect, exitFormulaModeEffect, formulaModeField, getActiveEditorView, onFormulaModeChange } from './lib/editor/formula-mode'
import { EditorView } from '@codemirror/view'

export default function App() {
  const { activeView, mode, settings, setSettings, sessions, setFormulaMode } = useStore()
  const api = useElectron()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  useTheme()

  // Debounced save for chat history (immediate + backup)
  const saveChatHistory = useCallback((data: typeof sessions) => {
    if (!api || data.length === 0) return
    api.setChatHistory(data)
  }, [api])

  // Load settings from Electron on mount
  useEffect(() => {
    if (!api) return
    api.getSettings().then((res: any) => {
      if (res.success && res.data) {
        setSettings(res.data as typeof settings)
      }
    })
    // Load chat history
    api.getChatHistory().then((res: any) => {
      if (res.success && res.data) {
        const store = useStore.getState()
        res.data.forEach((session: any) => {
          if (!store.sessions.find(s => s.id === session.id)) {
            store.sessions.push(session)
          }
        })
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save chat history: immediate save on change + periodic backup
  useEffect(() => {
    if (!api || sessions.length === 0) return
    
    // Immediate save (debounced 500ms)
    const timeoutId = setTimeout(() => {
      saveChatHistory(sessions)
    }, 500)
    
    // Periodic backup every 30 seconds
    const backupInterval = setInterval(() => {
      saveChatHistory(sessions)
    }, 30000)
    
    return () => {
      clearTimeout(timeoutId)
      clearInterval(backupInterval)
    }
  }, [sessions, api, saveChatHistory])

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleOpenShortcuts = () => setShortcutsOpen(true)
    window.addEventListener('open-keyboard-shortcuts', handleOpenShortcuts)
    return () => window.removeEventListener('open-keyboard-shortcuts', handleOpenShortcuts)
  }, [])

  // Keyboard shortcuts (capture phase for maximum priority)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ctrl+Shift+H : 快捷键帮助
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'))
        return
      }

      // Ctrl+\ : toggle student panel
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        useStore.getState().toggleStudentPanel()
      }
      // Ctrl+S : save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const { activeNote } = useStore.getState()
        if (activeNote && api) {
          api.writeNote(activeNote as Parameters<typeof api.writeNote>[0])
            .then((res: any) => {
              if (res?.success) {
                window.dispatchEvent(new CustomEvent('toast', { 
                  detail: { type: 'success', title: '保存成功', description: '笔记已保存到本地' } 
                }))
              }
            })
            .catch(() => {
              window.dispatchEvent(new CustomEvent('toast', { 
                detail: { type: 'error', title: '保存失败', description: '请稍后重试' } 
              }))
            })
        }
      }
      // Ctrl+Shift+V : voice input
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('trigger-voice-input'))
      }
      // Ctrl+M / Ctrl+Shift+M / F9 : formula mode
      const isCtrlM = (e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyM' || e.key === 'm' || e.key === 'M')
      const isF9 = e.key === 'F9' || e.code === 'F9'
      if (isCtrlM || isF9) {
        const target = e.target as HTMLElement
        if (target.closest('.cm-editor') && !isF9) {
          return
        }

        e.preventDefault()
        e.stopPropagation()

        let cmView: EditorView | null = null
        const editorEl = target.closest('.cm-editor')
        if (editorEl instanceof HTMLElement) {
          cmView = EditorView.findFromDOM(editorEl)
        }
        if (!cmView) {
          cmView = getActiveEditorView()
        }
        if (!cmView) return

        cmView.focus()

        const isBlock = e.shiftKey
        try {
          const fm = cmView.state.field(formulaModeField)
          if (fm.active) {
            cmView.dispatch({ effects: exitFormulaModeEffect.of(null) })
          } else {
            cmView.dispatch({ effects: enterFormulaModeEffect.of({ isBlock }) })
          }
        } catch (err) {
          cmView.dispatch({ effects: enterFormulaModeEffect.of({ isBlock }) })
        }
      }
    }
    // Use capture phase to intercept before any other handler
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [api])

  return (
    <ErrorBoundary>
      <AppShell>
        {activeView === 'editor' ? (
          mode === 'code' ? (
            <CodeLearningMode />
          ) : (
            <SmartEditor />
          )
        ) : (
          <Welcome />
        )}
      </AppShell>

      {/* Global modals */}
      <SettingsDialog />
      <NewNoteDialog />
      <NewNotebookDialog />
      
      {/* Toast notifications */}
      <ToastContainer />
      
      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </ErrorBoundary>
  )
}
