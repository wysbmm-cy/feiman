import React, { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView } from '@codemirror/view'
import { useStore } from '../../store'
import { formulaModeExtension, registerEditorView } from '../../lib/editor/formula-mode'
import { tabStopExtension } from '../../lib/editor/tab-stops'
import { mathHighlightExtension } from '../../lib/editor/math-highlight'
import { markdownShortcuts } from '../../lib/editor/markdown-shortcuts'

const customTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent !important', height: '100%' },
  '.cm-scroller': { fontFamily: 'var(--font-editor)' },
  '.cm-content': { color: 'var(--text-primary)', padding: '16px' },
  '.cm-cursor': { borderLeftColor: 'var(--accent-primary)', borderLeftWidth: '2px' },
  '.cm-selectionBackground': { backgroundColor: 'var(--accent-muted) !important' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--accent-muted) !important' },
  '.cm-line': { lineHeight: '1.8' },
}, { dark: true })

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

export function MarkdownEditor({ value, onChange, placeholder, className }: MarkdownEditorProps) {
  const { settings } = useStore()
  const fontSizeMap = { sm: '13px', md: '14px', lg: '15px' }
  const fontSize = fontSizeMap[settings.appearance.fontSize]

  const extensions = useMemo(() => [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    customTheme,
    // Formula mode comes before tab-stops so TAB keeps formula-layer behavior.
    formulaModeExtension(),
    tabStopExtension(),
    mathHighlightExtension(),
    markdownShortcuts,
    ...(placeholder ? [EditorView.contentAttributes.of({ 'data-placeholder': placeholder })] : []),
  ], [placeholder])

  return (
    <div className={`h-full overflow-hidden ${className || ''}`} style={{ fontSize }}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        onCreateEditor={(view) => registerEditorView(view)}
        onFocus={(_event: React.FocusEvent, view?: EditorView) => {
          if (view) registerEditorView(view)
        }}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          highlightActiveLine: false,
          highlightSelectionMatches: false
        }}
        style={{ height: '100%' }}
        className="selectable"
      />
    </div>
  )
}
