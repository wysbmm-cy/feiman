import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { KEYBOARD_ROWS, FORMULA_KEYS, FORMULA_SHIFT_KEYS, type FormulaKey } from '../../lib/editor/formula-keymap'
import { useStore } from '../../store'
import { getActiveEditorView, handleFormulaKey, exitFormulaModeEffect } from '../../lib/editor/formula-mode'
import { FormulaQuickBar } from './FormulaQuickBar'
import { FormulaPreview } from './FormulaPreview'
import { Maximize2, Minimize2, Keyboard, X } from 'lucide-react'

type PanelSize = 'sm' | 'md' | 'lg'

const shiftNumberMap: Record<string, string> = {
  '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': '^', '7': '&', '8': '*', '9': '(', '0': ')', '-': '_', '=': '+'
}

export function FormulaOverlay() {
  const { formulaMode, setFormulaMode } = useStore()
  const [showShift, setShowShift] = useState(false)
  const [panelSize, setPanelSize] = useState<PanelSize>('md')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const closeFormulaMode = useCallback(() => {
    const view = getActiveEditorView()

    if (view) {
      try {
        view.dispatch({ effects: exitFormulaModeEffect.of(null) })
        view.focus()
      } catch {
        // Ignore stale editor-view failures and still force-close UI state.
      }
    }

    // Force-close local UI state to avoid stuck overlay even if editor callback is lost.
    setFormulaMode({ active: false, layer: 'formula' })
  }, [setFormulaMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShowShift(true)
      if (e.key === 'Escape') {
        closeFormulaMode()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShowShift(false)
    }
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [closeFormulaMode])

  const sizeStyle = useMemo(() => {
    if (panelSize === 'sm') return { width: 360, maxHeight: 280 }
    if (panelSize === 'lg') return { width: 620, maxHeight: 520 }
    return { width: 480, maxHeight: 380 }
  }, [panelSize])

  if (!formulaMode.active) return null

  const cycleSize = () => {
    setPanelSize((prev) => (prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'sm'))
  }

  const isFormulaLayer = formulaMode.layer === 'formula'

  return (
    <div
      className="absolute right-3 bottom-3 z-40 rounded-xl border shadow-2xl overflow-hidden animate-fade-in glass-panel-strong"
      style={{
        borderColor: 'var(--border-strong)',
        ...sizeStyle
      }}
    >
      <div
        className="flex items-center justify-between px-2.5 py-1.5 border-b"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'color-mix(in srgb, var(--accent-muted), transparent 45%)'
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={{
              background: isFormulaLayer ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              color: isFormulaLayer ? 'var(--accent-foreground)' : 'var(--text-muted)'
            }}
          >
            FORMULA
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            TAB Switch · F9 Exit
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setShowKeyboard((prev) => !prev)}
            title={showKeyboard ? 'Hide keyboard map' : 'Show keyboard map'}
          >
            <Keyboard size={12} />
          </button>
          <button
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onClick={cycleSize}
            title="Resize panel"
          >
            <Maximize2 size={12} />
          </button>
          <button
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? 'Expand panel' : 'Collapse panel'}
          >
            <Minimize2 size={12} />
          </button>
          <button
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onClick={closeFormulaMode}
            title="Exit formula mode"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="max-h-[inherit] overflow-hidden">
          <FormulaQuickBar />
          <div className="grid grid-cols-[1fr_220px] gap-0 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="min-h-[120px] max-h-[320px] overflow-auto p-2">
              {isFormulaLayer ? (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      Keyboard Mapping
                    </span>
                    <button
                      className="text-[10px] px-1.5 py-0.5 rounded border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                      onClick={() => setShowShift((prev) => !prev)}
                    >
                      SHIFT {showShift ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {showKeyboard ? (
                    <div className="space-y-1">
                      {KEYBOARD_ROWS.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-1 justify-center">
                          {row.map((key) => {
                            const shiftKeyStr = rowIdx === 0 ? shiftNumberMap[key] : key.toUpperCase()
                            const activeKeyStr = showShift ? shiftKeyStr : key
                            let entry = showShift ? FORMULA_SHIFT_KEYS[activeKeyStr] : FORMULA_KEYS[key]
                            if (!entry) entry = FORMULA_KEYS[key]
                            if (!entry) return null
                            return (
                              <KeyCap
                                key={key}
                                keyChar={activeKeyStr}
                                entry={entry}
                                showShift={showShift}
                                normalKeyStr={key}
                                shiftKeyStr={shiftKeyStr}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="rounded-lg border p-3 text-[11px]"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-elevated)'
                      }}
                    >
                      Quick structures are available above. Open keyboard mapping if you need full key-to-symbol reference.
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="rounded-lg border p-3 text-[11px]"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)'
                  }}
                >
                  Normal text layer. Press TAB to return to formula layer.
                </div>
              )}
            </div>

            <FormulaPreview compact />
          </div>
        </div>
      )}
    </div>
  )
}

function KeyCap({
  keyChar,
  entry,
  showShift,
  normalKeyStr,
  shiftKeyStr
}: {
  keyChar: string
  entry: FormulaKey
  showShift?: boolean
  normalKeyStr: string
  shiftKeyStr: string
}) {
  const isStructure = entry.hasTabStops
  const shiftEntry = FORMULA_SHIFT_KEYS[shiftKeyStr]

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const view = getActiveEditorView()
    if (!view) return
    handleFormulaKey(view, keyChar)
    view.focus()
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95"
      style={{
        width: 32,
        height: 36,
        background: isStructure ? 'var(--accent-muted)' : 'var(--bg-elevated)',
        border: `1px solid ${isStructure ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
        borderRadius: 4,
        opacity: isStructure ? 1 : 0.88,
      }}
      onClick={handleClick}
    >
      <span className="text-[11px] font-mono leading-none z-10" style={{ color: isStructure ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
        {entry.label}
      </span>
      <span className="text-[8px] font-mono leading-none absolute bottom-0.5 right-0.5" style={{ color: 'var(--text-disabled)' }}>
        {keyChar}
      </span>

      {!showShift && shiftEntry && (
        <span className="text-[7px] absolute top-0.5 left-0.5 opacity-45 font-mono" style={{ color: 'var(--accent-primary)' }}>
          {shiftEntry.label}
        </span>
      )}
      {showShift && (
        <span className="text-[7px] absolute top-0.5 left-0.5 opacity-45 font-mono" style={{ color: 'var(--text-muted)' }}>
          {FORMULA_KEYS[normalKeyStr]?.label}
        </span>
      )}
    </div>
  )
}
