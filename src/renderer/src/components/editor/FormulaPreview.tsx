import React, { useEffect, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { getActiveEditorView } from '../../lib/editor/formula-mode'

interface FormulaPreviewProps {
  compact?: boolean
}

function extractFormulaAtCursor(doc: string, pos: number): { latex: string; source: 'block' | 'inline' | 'command' | 'none' } {
  const blockStart = doc.lastIndexOf('$$', pos)
  const blockEnd = doc.indexOf('$$', pos)
  if (blockStart !== -1 && blockEnd !== -1 && blockStart < blockEnd && pos >= blockStart + 2 && pos <= blockEnd) {
    const latex = doc.slice(blockStart + 2, blockEnd).trim()
    if (latex) return { latex, source: 'block' }
  }

  const inlineStart = doc.lastIndexOf('$', Math.max(0, pos - 1))
  const inlineEnd = doc.indexOf('$', pos)
  if (
    inlineStart !== -1 &&
    inlineEnd !== -1 &&
    inlineStart < inlineEnd &&
    doc[inlineStart - 1] !== '$' &&
    doc[inlineEnd + 1] !== '$'
  ) {
    const latex = doc.slice(inlineStart + 1, inlineEnd).trim()
    if (latex) return { latex, source: 'inline' }
  }

  const left = Math.max(0, pos - 80)
  const right = Math.min(doc.length, pos + 80)
  const segment = doc.slice(left, right)
  const relPos = pos - left
  const regex = /\\[a-zA-Z]+(?:\[[^\]]*\])?(?:\{[^{}]*\})*/g
  let matched: RegExpExecArray | null = null
  let best: { text: string; dist: number } | null = null

  while ((matched = regex.exec(segment)) !== null) {
    const start = matched.index
    const end = start + matched[0].length
    const dist = relPos < start ? start - relPos : relPos > end ? relPos - end : 0
    if (!best || dist < best.dist) {
      best = { text: matched[0], dist }
    }
  }

  if (best && best.text.trim()) {
    return { latex: best.text.trim(), source: 'command' }
  }

  return { latex: '', source: 'none' }
}

export function FormulaPreview({ compact = false }: FormulaPreviewProps) {
  const [latex, setLatex] = useState('')
  const [source, setSource] = useState<'block' | 'inline' | 'command' | 'none'>('none')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const view = getActiveEditorView()
    if (!view) return

    const updatePreview = () => {
      const state = view.state
      const pos = state.selection.main.head
      const doc = state.doc.toString()
      const result = extractFormulaAtCursor(doc, pos)
      setLatex(result.latex)
      setSource(result.source)
    }

    updatePreview()
    const interval = window.setInterval(updatePreview, 220)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div
      className="flex flex-col border-l flex-shrink-0 p-2"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-elevated)',
        width: compact ? 220 : 260
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>实时预览</span>
        {source !== 'none' && (
          <span className="text-[9px] uppercase px-1 py-0.5 rounded" style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}>
            {source}
          </span>
        )}
      </div>

      <div
        className="flex-1 rounded p-2 overflow-auto relative"
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          minHeight: compact ? 90 : 120
        }}
      >
        {latex ? (
          <div
            ref={(el) => {
              if (!el) return
              try {
                katex.render(latex, el, {
                  throwOnError: false,
                  displayMode: true,
                  strict: false
                })
                setError(null)
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Render error')
              }
            }}
            className="text-sm w-full"
          />
        ) : (
          <div className="text-[11px] flex items-center justify-center h-full opacity-60 text-center" style={{ color: 'var(--text-muted)' }}>
            Move cursor into a formula to preview instantly.
          </div>
        )}
      </div>
      {error && (
        <div className="mt-1 text-[10px] break-words" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
