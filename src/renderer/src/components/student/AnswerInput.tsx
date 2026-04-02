import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Send, FilePenLine, Type, Columns2, Eye, Expand, Shrink, Sigma, X } from 'lucide-react'
import { VoiceInputSimple } from '../audio/VoiceInputSimple'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView, keymap } from '@codemirror/view'
import { MarkdownPreview } from '../editor/MarkdownPreview'
import katex from 'katex'
import { formulaModeExtension, registerEditorView } from '../../lib/editor/formula-mode'
import { tabStopExtension } from '../../lib/editor/tab-stops'

interface AnswerInputProps {
  onSubmit: (answer: string) => void
  onCancel: () => void
  disabled?: boolean
  placeholder?: string
  compact?: boolean
}

type ComposerType = 'plain' | 'markdown'
type MarkdownView = 'edit' | 'split' | 'preview'

interface FormulaSnippet {
  id: string
  label: string
  latex: string
  insert: string
  cursorOffset: number
}

const FORMULA_SNIPPETS: FormulaSnippet[] = [
  { id: 'sqrt', label: '根号', latex: '\\sqrt{x}', insert: '$\\sqrt{ }$', cursorOffset: 8 },
  { id: 'nroot', label: 'n次根', latex: '\\sqrt[n]{x}', insert: '$\\sqrt[ ]{ }$', cursorOffset: 8 },
  { id: 'frac', label: '分数', latex: '\\frac{a}{b}', insert: '$\\frac{ }{ }$', cursorOffset: 8 },
  { id: 'sum', label: '求和', latex: '\\sum_{i=1}^{n} i', insert: '$\\sum_{ }^{ } $', cursorOffset: 7 },
  { id: 'int', label: '积分', latex: '\\int_{a}^{b} f(x)\\,dx', insert: '$\\int_{ }^{ }  \\, dx$', cursorOffset: 7 },
  { id: 'sup', label: '上标', latex: 'x^{2}', insert: '$x^{ }$', cursorOffset: 5 },
  { id: 'sub', label: '下标', latex: 'x_{1}', insert: '$x_{ }$', cursorOffset: 5 },
]

const chatEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent !important',
    height: '100%'
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-editor)',
    overflow: 'auto'
  },
  '.cm-content': {
    color: 'var(--text-primary)',
    padding: '10px',
    minHeight: '120px'
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent-primary)',
    borderLeftWidth: '2px'
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--accent-muted) !important'
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--accent-muted) !important'
  },
  '.cm-line': {
    lineHeight: '1.7'
  },
}, { dark: true })

export function AnswerInput({ onSubmit, onCancel, disabled, placeholder, compact = false }: AnswerInputProps) {
  const [value, setValue] = useState('')
  const [composerType, setComposerType] = useState<ComposerType>('plain')
  const [markdownView, setMarkdownView] = useState<MarkdownView>('edit')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showFormula, setShowFormula] = useState(false)
  const [formulaDraft, setFormulaDraft] = useState('\\sqrt{x}')
  const [rows, setRows] = useState(1)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const formulaRef = useRef<HTMLDivElement>(null)

  const focusEditor = useCallback(() => {
    if (composerType === 'plain') {
      textareaRef.current?.focus()
      return
    }
    editorViewRef.current?.focus()
  }, [composerType])

  useEffect(() => {
    if (!disabled) {
      window.setTimeout(() => focusEditor(), 60)
    }
  }, [disabled, focusEditor])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (formulaRef.current && !formulaRef.current.contains(target)) {
        setShowFormula(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue('')
    window.setTimeout(() => focusEditor(), 60)
  }, [value, disabled, onSubmit, focusEditor])

  const insertAtCursor = useCallback((insertText: string, cursorOffset = insertText.length) => {
    if (composerType === 'plain') {
      const textarea = textareaRef.current
      if (!textarea) {
        setValue((prev) => `${prev}${insertText}`)
        return
      }
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const next = `${value.slice(0, start)}${insertText}${value.slice(end)}`
      setValue(next)
      window.setTimeout(() => {
        textarea.focus()
        const cursor = start + cursorOffset
        textarea.setSelectionRange(cursor, cursor)
      }, 0)
      return
    }

    const view = editorViewRef.current
    if (!view) {
      setValue((prev) => `${prev}${insertText}`)
      return
    }
    const selection = view.state.selection.main
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: insertText },
      selection: { anchor: selection.from + cursorOffset }
    })
    setValue(view.state.doc.toString())
    view.focus()
  }, [composerType, value])

  const insertFormulaSnippet = useCallback((snippet: FormulaSnippet) => {
    insertAtCursor(snippet.insert, snippet.cursorOffset)
    setFormulaDraft(snippet.latex)
  }, [insertAtCursor])

  const insertDraftFormula = useCallback(() => {
    const trimmed = formulaDraft.trim()
    if (!trimmed) return
    const insertText = `$${trimmed}$`
    insertAtCursor(insertText, insertText.length)
  }, [formulaDraft, insertAtCursor])

  const markdownExtensions = useMemo(() => [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    chatEditorTheme,
    formulaModeExtension(),
    tabStopExtension(),
    keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          handleSubmit()
          return true
        }
      },
      {
        key: 'Escape',
        run: () => {
          onCancel()
          return true
        }
      }
    ])
  ], [handleSubmit, onCancel])

  const handleKeyDownPlain = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleVoiceTranscription = (text: string) => {
    const joined = composerType === 'plain'
      ? value + (value ? ' ' : '') + text
      : value + (value ? '\n' : '') + text
    setValue(joined)
  }

  const formulaHtml = useMemo(() => {
    try {
      return katex.renderToString(formulaDraft || '\\sqrt{x}', {
        displayMode: true,
        throwOnError: false,
        strict: false
      })
    } catch {
      return ''
    }
  }, [formulaDraft])

  const showMarkdown = composerType === 'markdown'
  const disabledAction = disabled || !value.trim()
  const maxHeight = compact ? 200 : 300

  return (
    <div className="relative">
      {/* Advanced Panel - Hidden by default */}
      {(showAdvanced || showFormula) && (
        <div className="mb-2 p-2 rounded-lg border animate-fade-in" style={{ 
          borderColor: 'var(--border-subtle)', 
          background: 'var(--bg-surface)' 
        }}>
          {/* Formula Panel */}
          {showFormula && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>公式插入</span>
                <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-accent-muted"
                  style={{ color: 'var(--text-muted)' }} onClick={() => setShowFormula(false)}>
                  <X size={10} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {FORMULA_SNIPPETS.map((snippet) => (
                  <button key={snippet.id}
                    className="h-5 px-1.5 rounded text-[9px] border hover:bg-accent-muted hover:border-accent transition-colors"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    onClick={() => insertFormulaSnippet(snippet)}>
                    {snippet.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <input value={formulaDraft} onChange={(e) => setFormulaDraft(e.target.value)}
                  className="flex-1 rounded px-1.5 py-1 text-[10px] outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  placeholder="LaTeX..." />
                <button className="px-2 py-1 rounded text-[10px] font-medium transition-colors hover:opacity-80"
                  style={{ background: 'var(--accent-primary)', color: 'var(--accent-foreground)' }}
                  onClick={insertDraftFormula}>插入</button>
              </div>
              <div className="mt-1.5 rounded border p-1.5 h-10 flex items-center justify-center overflow-x-auto"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                {formulaHtml ? (
                  <div className="scale-75 origin-center" dangerouslySetInnerHTML={{ __html: formulaHtml }} />
                ) : (
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>预览</span>
                )}
              </div>
            </div>
          )}

          {/* Markdown Mode Selector - Always show when in Markdown mode */}
          {showMarkdown && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Markdown:</span>
                <div className="h-6 px-1.5 rounded flex items-center gap-1 border bg-accent-muted border-accent">
                  {markdownView === 'edit' ? <FilePenLine size={9} /> : markdownView === 'split' ? <Columns2 size={9} /> : <Eye size={9} />}
                  <select value={markdownView} onChange={(e) => setMarkdownView(e.target.value as MarkdownView)}
                    className="terminal-select bg-transparent text-[9px] font-medium outline-none cursor-pointer text-accent">
                    <option value="edit">编辑</option>
                    <option value="split">分屏</option>
                    <option value="preview">预览</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Input Area - Clean Layout */}
      <div className="rounded-lg border transition-colors relative" style={{
        borderColor: disabled ? 'var(--border-subtle)' : 'var(--border-default)',
        background: 'var(--bg-elevated)',
      }}>
        {/* Markdown Mode Indicator - Small badge in corner */}
        {showMarkdown && (
          <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
            <div className="relative group">
              <button
                className="h-6 px-2 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 bg-accent-muted text-accent border border-accent hover:opacity-80"
                title="点击切换模式，或右键更多选项"
              >
                {markdownView === 'edit' ? <FilePenLine size={9} /> : markdownView === 'split' ? <Columns2 size={9} /> : <Eye size={9} />}
                <span>Markdown</span>
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 py-1 rounded-lg border shadow-lg bg-[var(--bg-surface)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[120px]"
                style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent-muted flex items-center gap-2"
                  onClick={() => setMarkdownView('edit')}
                >
                  <FilePenLine size={10} />
                  <span>编辑</span>
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent-muted flex items-center gap-2"
                  onClick={() => setMarkdownView('split')}
                >
                  <Columns2 size={10} />
                  <span>分屏</span>
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent-muted flex items-center gap-2"
                  onClick={() => setMarkdownView('preview')}
                >
                  <Eye size={10} />
                  <span>预览</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1.5 p-1.5 items-end">

          {showMarkdown ? (
            <div className="flex-1 rounded border overflow-hidden" style={{
              borderColor: 'var(--border-subtle)', minHeight: 60, maxHeight, background: 'var(--bg-base)'
            }}>
              {markdownView === 'split' ? (
                <div className="h-full flex">
                  <div className="flex-1 border-r" style={{ borderColor: 'var(--border-subtle)' }}>
                    <CodeMirror value={value} onChange={setValue} extensions={markdownExtensions} editable={!disabled}
                      onCreateEditor={(view) => { editorViewRef.current = view; registerEditorView(view) }}
                      basicSetup={{ lineNumbers: false, foldGutter: false, dropCursor: false, allowMultipleSelections: false, indentOnInput: true, highlightActiveLine: false, highlightSelectionMatches: false }}
                      style={{ height: '100%' }} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <MarkdownPreview content={value || '*Preview*'} className="h-full text-xs" />
                  </div>
                </div>
              ) : markdownView === 'preview' ? (
                <MarkdownPreview content={value || '*Preview*'} className="h-full text-xs" />
              ) : (
                <CodeMirror value={value} onChange={setValue} extensions={markdownExtensions} editable={!disabled}
                  onCreateEditor={(view) => { editorViewRef.current = view; registerEditorView(view) }}
                  basicSetup={{ lineNumbers: false, foldGutter: false, dropCursor: false, allowMultipleSelections: false, indentOnInput: true, highlightActiveLine: false, highlightSelectionMatches: false }}
                  style={{ height: '100%' }} />
              )}
            </div>
          ) : (
            <textarea ref={textareaRef}
              className="flex-1 resize-none text-xs outline-none bg-transparent px-3 py-2 border rounded-lg"
              style={{ color: 'var(--text-primary)', minHeight: 44, maxHeight, borderColor: disabled ? 'var(--border-subtle)' : 'var(--border-default)' }}
              placeholder={placeholder ?? '输入消息...'} value={value} onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDownPlain} disabled={disabled} rows={rows} />
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 pb-0.5">
            <div className="relative group">
              <button
                className={`w-7 h-7 rounded-lg transition-all flex items-center justify-center ${showFormula ? 'bg-accent-muted text-accent' : 'text-muted hover:text-primary'}`}
                style={{ border: '1px solid var(--border-subtle)' }}
                title="公式"
              >
                <Sigma size={12} />
              </button>
              {/* Formula Dropdown */}
              {showFormula && (
                <div className="absolute right-0 bottom-full mb-1 p-2 rounded-lg border shadow-lg bg-[var(--bg-surface)] z-20 min-w-[200px]">
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {FORMULA_SNIPPETS.map((snippet) => (
                      <button key={snippet.id}
                        className="h-5 px-1.5 rounded text-[9px] border hover:bg-accent-muted hover:border-accent transition-colors"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                        onClick={() => insertFormulaSnippet(snippet)}>
                        {snippet.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input value={formulaDraft} onChange={(e) => setFormulaDraft(e.target.value)}
                      className="flex-1 rounded px-1.5 py-1 text-[10px] outline-none"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                      placeholder="LaTeX..." />
                    <button className="px-2 py-1 rounded text-[10px] font-medium transition-colors hover:opacity-80"
                      style={{ background: 'var(--accent-primary)', color: 'var(--accent-foreground)' }}
                      onClick={insertDraftFormula}>插入</button>
                  </div>
                  <div className="mt-1.5 rounded border p-1.5 h-10 flex items-center justify-center overflow-x-auto"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                    {formulaHtml ? (
                      <div className="scale-75 origin-center" dangerouslySetInnerHTML={{ __html: formulaHtml }} />
                    ) : (
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>预览</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            {!showMarkdown && (
              <div className="relative group">
                <button
                  className="w-7 h-7 rounded-lg transition-all flex items-center justify-center text-muted hover:text-primary"
                  style={{ border: '1px solid var(--border-subtle)' }}
                  title="切换到 Markdown"
                >
                  <FilePenLine size={12} />
                </button>
                <div className="absolute right-0 bottom-full mb-1 py-1 rounded-lg border shadow-lg bg-[var(--bg-surface)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[100px]"
                  style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent-muted"
                    onClick={() => setComposerType('markdown')}
                  >
                    切换到 Markdown
                  </button>
                </div>
              </div>
            )}
            {!compact && <VoiceInputSimple compact onTranscriptionComplete={handleVoiceTranscription} />}
            <button onClick={handleSubmit} disabled={disabledAction}
              className="w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
              style={{ background: disabledAction ? 'var(--border-subtle)' : 'var(--accent-primary)', color: disabledAction ? 'var(--text-muted)' : 'var(--accent-foreground)' }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
