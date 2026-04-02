import React, { useEffect, useState } from 'react'
import { Bold, Italic, Code, Link, List, ListOrdered, Quote, Strikethrough, CheckSquare, Heading1, Heading2 } from 'lucide-react'
import { EditorView } from '@codemirror/view'
import { getActiveEditorView } from '../../lib/editor/formula-mode'
import { wrapSelection, toggleLinePrefix, setHeading } from '../../lib/editor/markdown-shortcuts'

interface FloatingToolbarProps {
  view: EditorView | null
}

export function FloatingToolbar({ view }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [hasSelection, setHasSelection] = useState(false)

  useEffect(() => {
    if (!view) return

    const updateToolbar = () => {
      const selection = view.state.selection.main
      const from = selection.from
      const to = selection.to
      
      if (from !== to) {
        setHasSelection(true)
        
        // Calculate position
        const coords = view.coordsAtPos(from)
        const editorRect = view.dom.getBoundingClientRect()
        
        if (coords) {
          setPosition({
            x: coords.left - editorRect.left + 50,
            y: coords.top - editorRect.top - 50
          })
        }
      } else {
        setHasSelection(false)
      }
    }

    // Listen for selection changes
    const listener = EditorView.updateListener.of((update) => {
      if (update.selectionSet) {
        updateToolbar()
      }
    })

    // Initial check
    updateToolbar()

    return () => {
      // Cleanup if needed
    }
  }, [view])

  if (!hasSelection || !position) return null

  const toolbarItems = [
    { icon: Bold, action: () => wrapSelection('**', '**')(view!), title: '粗体 (Ctrl+B)' },
    { icon: Italic, action: () => wrapSelection('*', '*')(view!), title: '斜体 (Ctrl+I)' },
    { icon: Strikethrough, action: () => wrapSelection('~~', '~~')(view!), title: '删除线' },
    { icon: Code, action: () => wrapSelection('`', '`')(view!), title: '代码 (Ctrl+Shift+K)' },
    { type: 'separator' },
    { icon: Heading1, action: () => setHeading(1)(view!), title: '标题 1 (Ctrl+1)' },
    { icon: Heading2, action: () => setHeading(2)(view!), title: '标题 2 (Ctrl+2)' },
    { type: 'separator' },
    { icon: List, action: () => toggleLinePrefix('- ')(view!), title: '无序列表 (Ctrl+Shift+8)' },
    { icon: ListOrdered, action: () => toggleLinePrefix('1. ')(view!), title: '有序列表 (Ctrl+Shift+7)' },
    { icon: CheckSquare, action: () => toggleLinePrefix('- [ ] ')(view!), title: '任务列表' },
    { icon: Quote, action: () => toggleLinePrefix('> ')(view!), title: '引用 (Ctrl+Q)' },
  ]

  return (
    <div
      className="absolute z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-lg border backdrop-blur-sm"
      style={{
        left: Math.min(position.x, (view?.dom.clientWidth || 800) - 400),
        top: Math.max(position.y, 10),
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {toolbarItems.map((item, index) => {
        if ('type' in item && item.type === 'separator') {
          return (
            <div
              key={index}
              className="w-px h-4 mx-0.5"
              style={{ background: 'var(--border-subtle)' }}
            />
          )
        }

        const { icon: Icon, action, title } = item as { icon: React.ElementType; action: () => void; title: string }
        
        return (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              action()
              view?.focus()
            }}
            className="p-1.5 rounded hover:bg-black/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title={title}
          >
            <Icon size={14} />
          </button>
        )
      })}
    </div>
  )
}