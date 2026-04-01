import React from 'react'
import { getActiveEditorView } from '../../lib/editor/formula-mode'
import { insertWithTabStops } from '../../lib/editor/tab-stops'

interface QuickAction {
  id: string
  label: string
  tooltip: string
  template: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'frac', label: 'Frac', tooltip: '\\frac{a}{b}', template: '\\frac{$1}{$2}' },
  { id: 'sqrt', label: 'Root', tooltip: '\\sqrt{x}', template: '\\sqrt{$1}' },
  { id: 'nroot', label: 'N-Root', tooltip: '\\sqrt[n]{x}', template: '\\sqrt[$1]{$2}' },
  { id: 'sup', label: 'Sup', tooltip: 'x^{2}', template: '^{$1}' },
  { id: 'sub', label: 'Sub', tooltip: 'x_{1}', template: '_{$1}' },
  { id: 'sum', label: 'Sigma', tooltip: '\\sum_{i=1}^{n}', template: '\\sum_{$1}^{$2} $3' },
  { id: 'int', label: 'Int', tooltip: '\\int_{a}^{b}', template: '\\int_{$1}^{$2} $3 \\, dx' },
  { id: 'lim', label: 'Lim', tooltip: '\\lim_{x \\to \\infty}', template: '\\lim_{$1 \\to $2} $3' },
  { id: 'matrix', label: 'Matrix', tooltip: '2x2 matrix', template: '\\begin{pmatrix}\n$1 & $2 \\\\\n$3 & $4\n\\end{pmatrix}' },
  { id: 'det', label: 'Det', tooltip: '2x2 determinant', template: '\\left|\\begin{matrix}\n$1 & $2 \\\\\n$3 & $4\n\\end{matrix}\\right|' },
]

export function FormulaQuickBar() {
  const insertAction = (action: QuickAction) => {
    const view = getActiveEditorView()
    if (!view) return

    const pos = view.state.selection.main.head
    insertWithTabStops(view, pos, pos, action.template)
    view.focus()
  }

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto no-scrollbar border-b"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-base)',
      }}
    >
      <span className="text-[10px] font-bold mr-2 select-none" style={{ color: 'var(--text-muted)' }}>
        Structures
      </span>

      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          className="flex items-center justify-center px-2 py-1 rounded text-xs font-mono transition-colors min-w-[42px]"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
          }}
          onClick={(e) => {
            e.preventDefault()
            insertAction(action)
          }}
          title={action.tooltip}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
