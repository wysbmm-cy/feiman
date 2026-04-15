import React from 'react'
import {
  Columns2, Edit3, Eye, PanelRight,
  Bold, Italic, Code, Link, List, ListOrdered,
  Quote, Minus, Table, Heading1, Heading2, Strikethrough, Image
} from 'lucide-react'
import { useStore } from '../../store'
import { cn } from '../../lib/utils'
import type { EditorViewMode } from '../../types'
import { wrapSelection, toggleLinePrefix, setHeading, insertLink, insertTable, insertHorizontalRule, insertImage } from '../../lib/editor/markdown-shortcuts'
import { getActiveEditorView } from '../../lib/editor/formula-mode'

interface ToolbarButton {
  icon: React.ElementType
  action: () => boolean
  title: string
}

export function EditorToolbar() {
  const {
    settings, updateAppearance,
    aiPanelOpen, toggleAIPanel
  } = useStore()

  const { editorViewMode } = settings.appearance

  const viewModes: { id: EditorViewMode; icon: React.ElementType; label: string }[] = [
    { id: 'edit', icon: Edit3, label: '编辑' },
    { id: 'split', icon: Columns2, label: '分屏' },
    { id: 'preview', icon: Eye, label: '预览' }
  ]

  const handleAction = (action: () => boolean) => {
    const view = getActiveEditorView()
    if (view) {
      action()
      view.focus()
    }
  }

  const textFormatting: ToolbarButton[] = [
    { icon: Bold, action: () => wrapSelection('**', '**')(getActiveEditorView()!), title: '粗体 (Ctrl+B)' },
    { icon: Italic, action: () => wrapSelection('*', '*')(getActiveEditorView()!), title: '斜体 (Ctrl+I)' },
    { icon: Strikethrough, action: () => wrapSelection('~~', '~~')(getActiveEditorView()!), title: '删除线 (Ctrl+Shift+U)' },
    { icon: Code, action: () => wrapSelection('`', '`')(getActiveEditorView()!), title: '行内代码 (Ctrl+Shift+K)' },
  ]

  const headings: ToolbarButton[] = [
    { icon: Heading1, action: () => setHeading(1)(getActiveEditorView()!), title: '标题 1 (Ctrl+1)' },
    { icon: Heading2, action: () => setHeading(2)(getActiveEditorView()!), title: '标题 2 (Ctrl+2)' },
  ]

  const lists: ToolbarButton[] = [
    { icon: List, action: () => toggleLinePrefix('- ')(getActiveEditorPath()!), title: '无序列表 (Ctrl+Shift+8)' },
    { icon: ListOrdered, action: () => toggleLinePrefix('1. ')(getActiveEditorView()!), title: '有序列表 (Ctrl+Shift+7)' },
    { icon: Quote, action: () => toggleLinePrefix('> ')(getActiveEditorView()!), title: '引用 (Ctrl+Q)' },
  ]

  const insert: ToolbarButton[] = [
    { icon: Link, action: () => { insertLink(getActiveEditorView()!); return true; }, title: '链接 (Ctrl+K)' },
    { icon: Image, action: () => { insertImage(getActiveEditorView()!); return true; }, title: '图片 (Ctrl+Shift+I)' },
    { icon: Table, action: () => { insertTable(getActiveEditorView()!); return true; }, title: '表格 (Ctrl+Shift+T)' },
    { icon: Minus, action: () => { insertHorizontalRule(getActiveEditorView()!); return true; }, title: '水平线 (Ctrl+Shift+H)' },
  ]

  const renderToolbarGroup = (group: ToolbarButton[], groupIndex: number, isLast: boolean) => (
    <React.Fragment key={groupIndex}>
      <div className="flex items-center gap-0.5">
        {group.map((item, itemIndex) => {
          const Icon = item.icon
          return (
            <button
              key={itemIndex}
              onClick={() => handleAction(item.action)}
              className="flex items-center justify-center w-7 h-7 rounded transition-all hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title={item.title}
            >
              <Icon size={14} />
            </button>
          )
        })}
      </div>
      {!isLast && (
        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
      )}
    </React.Fragment>
  )

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.15)', borderColor: 'rgba(255,255,255,0.1)' }}
    >
      {/* View mode switcher */}
      <div
        className="flex items-center rounded-lg p-0.5"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        {viewModes.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => updateAppearance({ editorViewMode: id })}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all duration-200',
              editorViewMode === id ? 'text-white' : ''
            )}
            style={{
              background: editorViewMode === id ? 'rgba(0,0,0,0.5)' : undefined,
              color: editorViewMode === id ? 'var(--primary-color)' : 'var(--text-muted)'
            }}
            title={label}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Center - Formatting Toolbar */}
      <div className="flex items-center gap-1">
        {renderToolbarGroup(textFormatting, 0, false)}
        {renderToolbarGroup(headings, 1, false)}
        {renderToolbarGroup(lists, 2, false)}
        {renderToolbarGroup(insert, 3, true)}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* AI Panel toggle */}
        <button
          onClick={toggleAIPanel}
          className="flex items-center justify-center w-7 h-7 rounded transition-all hover:opacity-80"
          style={{
            background: aiPanelOpen ? 'rgba(0,0,0,0.5)' : undefined,
            color: aiPanelOpen ? 'var(--primary-color)' : 'var(--text-muted)'
          }}
          title="切换 AI 面板 (Ctrl+\\)"
        >
          <PanelRight size={14} />
        </button>
      </div>
    </div>
  )
}

function getActiveEditorPath() {
  return getActiveEditorView()
}