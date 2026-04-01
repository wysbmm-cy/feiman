/**
 * Formula Mode — Modal keyboard input for LaTeX math.
 *
 * Uses DOM-level keydown interception (not CodeMirror keymap) because
 * CM6's keymap cannot reliably intercept single-character text input.
 *
 * State machine:
 *   NORMAL ──Ctrl+M──▶ FORMULA_LAYER ──TAB──▶ NORMAL_LAYER ──TAB──▶ FORMULA_LAYER
 *     ▲                      │                                           │
 *     └────── Ctrl+M ────────┴──────────── Ctrl+M ──────────────────────┘
 */

import {
  StateField,
  StateEffect,
  type Extension,
} from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { getFormulaKey } from './formula-keymap'
import { insertWithTabStops, tabStopField, clearTabStops, setTabStops } from './tab-stops'

// ── Types ──────────────────────────────────────────────────

export type FormulaLayer = 'formula' | 'normal'

export interface FormulaModeState {
  active: boolean
  layer: FormulaLayer
  isBlock: boolean
}

const INITIAL_STATE: FormulaModeState = {
  active: false,
  layer: 'formula',
  isBlock: false,
}

// ── Effects ────────────────────────────────────────────────

export const enterFormulaModeEffect = StateEffect.define<{ isBlock: boolean }>()
export const exitFormulaModeEffect = StateEffect.define<null>()
export const toggleLayerEffect = StateEffect.define<null>()

// ── State Field ────────────────────────────────────────────

export const formulaModeField = StateField.define<FormulaModeState>({
  create: () => INITIAL_STATE,

  update(state, tr) {
    for (const e of tr.effects) {
      if (e.is(enterFormulaModeEffect)) {
        return { active: true, layer: 'formula' as FormulaLayer, isBlock: e.value.isBlock }
      }
      if (e.is(exitFormulaModeEffect)) {
        return INITIAL_STATE
      }
      if (e.is(toggleLayerEffect)) {
        if (!state.active) return state
        return {
          ...state,
          layer: state.layer === 'formula' ? 'normal' as FormulaLayer : 'formula' as FormulaLayer,
        }
      }
    }
    return state
  },
})

// ── Listener: sync to external callback ────────────────────

type FormulaModeChangeCallback = (state: FormulaModeState) => void
const _onChangeCallbacks = new Set<FormulaModeChangeCallback>()

export function onFormulaModeChange(cb: FormulaModeChangeCallback): () => void {
  _onChangeCallbacks.add(cb)
  return () => {
    _onChangeCallbacks.delete(cb)
  }
}

// ── Active editor view registry (for global shortcuts) ─────

let _activeEditorView: EditorView | null = null

export function registerEditorView(view: EditorView): void {
  _activeEditorView = view
}

function isUsableEditorView(view: EditorView | null): view is EditorView {
  if (!view) return false
  if (!view.dom?.isConnected) return false
  try {
    view.state.field(formulaModeField)
    return true
  } catch {
    return false
  }
}

function isFocusedEditorView(view: EditorView): boolean {
  if (!view.dom?.isConnected) return false
  if (view.hasFocus) return true
  if (view.dom.classList.contains('cm-focused')) return true
  if (typeof document !== 'undefined' && document.activeElement) {
    return view.dom.contains(document.activeElement)
  }
  return false
}

function findEditorViewFromDom(selector: string): EditorView | null {
  if (typeof document === 'undefined') return null
  const el = document.querySelector(selector)
  if (!(el instanceof HTMLElement)) return null
  return EditorView.findFromDOM(el)
}

function isFormulaModeActive(view: EditorView): boolean {
  try {
    return view.state.field(formulaModeField).active
  } catch {
    return false
  }
}

function findFormulaActiveViewFromDom(): EditorView | null {
  if (typeof document === 'undefined') return null
  const editors = document.querySelectorAll('.cm-editor')
  for (const el of editors) {
    if (!(el instanceof HTMLElement)) continue
    const view = EditorView.findFromDOM(el)
    if (!isUsableEditorView(view)) continue
    if (isFormulaModeActive(view)) return view
  }
  return null
}

export function getActiveEditorView(): EditorView | null {
  if (isUsableEditorView(_activeEditorView) && (isFocusedEditorView(_activeEditorView) || isFormulaModeActive(_activeEditorView))) {
    return _activeEditorView
  }

  const focusedView = findEditorViewFromDom('.cm-editor.cm-focused')
  if (isUsableEditorView(focusedView)) {
    _activeEditorView = focusedView
    return focusedView
  }

  const formulaActiveView = findFormulaActiveViewFromDom()
  if (isUsableEditorView(formulaActiveView)) {
    _activeEditorView = formulaActiveView
    return formulaActiveView
  }

  _activeEditorView = null
  return null
}

const formulaModeListener = EditorView.updateListener.of((update) => {
  if (_onChangeCallbacks.size === 0) return
  for (const tr of update.transactions) {
    for (const e of tr.effects) {
      if (e.is(enterFormulaModeEffect) || e.is(exitFormulaModeEffect) || e.is(toggleLayerEffect)) {
        const state = update.state.field(formulaModeField)
        _onChangeCallbacks.forEach((cb) => cb(state))
        return
      }
    }
  }
})

// ── Commands ───────────────────────────────────────────────

function enterFormulaMode(view: EditorView, isBlock: boolean): void {
  const pos = view.state.selection.main.head

  if (isBlock) {
    const insert = '$$\n\n$$'
    view.dispatch({
      changes: { from: pos, to: pos, insert },
      selection: { anchor: pos + 3 },
      effects: enterFormulaModeEffect.of({ isBlock: true }),
    })
  } else {
    const insert = '$$'
    view.dispatch({
      changes: { from: pos, to: pos, insert },
      selection: { anchor: pos + 1 },
      effects: enterFormulaModeEffect.of({ isBlock: false }),
    })
  }
}

function exitFormulaMode(view: EditorView): void {
  const fmState = view.state.field(formulaModeField)
  if (!fmState.active) return

  const pos = view.state.selection.main.head
  const doc = view.state.doc.toString()

  let newPos = pos
  if (fmState.isBlock) {
    const nextClose = doc.indexOf('$$', pos)
    if (nextClose !== -1) newPos = nextClose + 2
  } else {
    const nextClose = doc.indexOf('$', pos)
    if (nextClose !== -1) newPos = nextClose + 1
  }

  const effects: StateEffect<unknown>[] = [exitFormulaModeEffect.of(null)]
  if (view.state.field(tabStopField)) {
    effects.push(clearTabStops.of(null))
  }

  view.dispatch({
    selection: { anchor: newPos },
    effects,
  })
}

function toggleLayer(view: EditorView): void {
  const fmState = view.state.field(formulaModeField)
  if (!fmState.active) return

  // If tab-stops are active, navigate them instead of toggling layer
  const tsState = view.state.field(tabStopField)
  if (tsState && tsState.activeIndex < tsState.stops.length - 1) {
    // Advance tab stop
    const nextIndex = tsState.activeIndex + 1
    const next = tsState.stops[nextIndex]
    view.dispatch({
      selection: { anchor: next.from, head: next.to },
      effects: setTabStops.of(tsState.stops), // keep stops, but we need advanceTabStop
    })
    return
  }

  // Clear any exhausted tab stops
  if (tsState) {
    view.dispatch({ effects: clearTabStops.of(null) })
  }

  view.dispatch({ effects: toggleLayerEffect.of(null) })
}

export function handleFormulaKey(view: EditorView, key: string): boolean {
  const entry = getFormulaKey(key)
  if (!entry) return false

  const pos = view.state.selection.main.head
  if (entry.hasTabStops) {
    insertWithTabStops(view, pos, pos, entry.output)
  } else {
    view.dispatch({
      changes: { from: pos, to: pos, insert: entry.output },
    })
  }
  return true
}

// ── DOM Event Handler (the core interceptor) ───────────────

const formulaDomHandler = EditorView.domEventHandlers({
  keydown(event: KeyboardEvent, view: EditorView): boolean {
    const fm = view.state.field(formulaModeField)

    // DEBUG: log Ctrl+M attempts (remove after confirming it works)
    if (event.code === 'KeyM' && (event.ctrlKey || event.metaKey)) {
      console.log('[FormulaMode] Ctrl+M detected', { key: event.key, code: event.code, ctrl: event.ctrlKey, shift: event.shiftKey, fmActive: fm.active })
    }

    // ── Ctrl+M: toggle formula mode (works regardless of mode) ──
    // Use event.code for robust detection (unaffected by IME / keyboard layout)
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyM') {
      event.preventDefault()
      event.stopPropagation()

      if (event.shiftKey) {
        // Ctrl+Shift+M: block formula mode
        if (fm.active) {
          exitFormulaMode(view)
        } else {
          enterFormulaMode(view, true)
        }
      } else {
        // Ctrl+M: inline formula mode
        if (fm.active) {
          exitFormulaMode(view)
        } else {
          enterFormulaMode(view, false)
        }
      }
      return true
    }

    // Everything below only applies when formula mode is active
    if (!fm.active) return false

    // ── Escape: exit formula mode ──
    if (event.key === 'Escape') {
      event.preventDefault()
      exitFormulaMode(view)
      return true
    }

    // ── Tab: toggle layer or navigate tab-stops ──
    if (event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault()

      // Check tab-stops first
      const tsState = view.state.field(tabStopField)
      if (tsState) {
        if (event.shiftKey && tsState.activeIndex > 0) {
          // Shift+Tab: go to previous tab-stop
          // (handled by tab-stops keymap, but let's be safe)
          return false
        }
        if (!event.shiftKey && tsState.activeIndex < tsState.stops.length - 1) {
          // Tab: go to next tab-stop (let tab-stops extension handle it)
          return false
        }
        // All tab-stops exhausted, clear them
        view.dispatch({ effects: clearTabStops.of(null) })
      }

      // Toggle layer
      view.dispatch({ effects: toggleLayerEffect.of(null) })
      return true
    }

    // ── In formula layer: intercept all printable keys ──
    if (fm.layer === 'formula') {
      // Allow modifier combos (Ctrl+C, Ctrl+V, Ctrl+Z, etc.) to pass through
      if (event.ctrlKey || event.metaKey || event.altKey) return false

      // Allow navigation keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
        'PageUp', 'PageDown', 'Delete'].includes(event.key)) return false

      // Backspace: normal delete behavior
      if (event.key === 'Backspace') return false

      // Space: insert thin space
      if (event.key === ' ') {
        event.preventDefault()
        const pos = view.state.selection.main.head
        view.dispatch({
          changes: { from: pos, to: pos, insert: '\\, ' },
        })
        return true
      }

      // Enter: newline in block mode
      if (event.key === 'Enter') {
        event.preventDefault()
        if (fm.isBlock) {
          const pos = view.state.selection.main.head
          view.dispatch({
            changes: { from: pos, to: pos, insert: ' \\\\\n' },
          })
        }
        return true
      }

      // Single printable character → map to LaTeX
      if (event.key.length === 1) {
        event.preventDefault()
        handleFormulaKey(view, event.key)
        return true
      }
    }

    // In normal layer: let all keys pass through (normal typing)
    return false
  },
})

// ── Extension bundle ───────────────────────────────────────

export function formulaModeExtension(): Extension {
  return [formulaModeField, formulaDomHandler, formulaModeListener]
}
