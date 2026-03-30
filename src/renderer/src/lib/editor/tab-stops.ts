/**
 * Tab-stop placeholder system for formula structures.
 *
 * When a structure like \frac{$1}{$2} is inserted, $1 and $2 become
 * tab-stop placeholders. Tab jumps forward, Shift+Tab jumps backward.
 *
 * Tab-stops are cleared when:
 * - All stops visited and user presses Tab again
 * - User presses Escape
 * - User clicks outside the formula
 */

import {
  StateField,
  StateEffect,
  type EditorState,
  type Transaction,
} from '@codemirror/state'
import { keymap, EditorView, Decoration, type DecorationSet } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

// ── Types ──────────────────────────────────────────────────

interface TabStop {
  from: number
  to: number
}

interface TabStopState {
  stops: TabStop[]
  activeIndex: number
}

// ── Effects ────────────────────────────────────────────────

export const setTabStops = StateEffect.define<TabStop[]>()
export const clearTabStops = StateEffect.define<null>()
const advanceTabStop = StateEffect.define<number>() // new activeIndex

// ── State Field ────────────────────────────────────────────

export const tabStopField = StateField.define<TabStopState | null>({
  create: () => null,

  update(state, tr: Transaction) {
    // Process effects
    for (const e of tr.effects) {
      if (e.is(setTabStops)) {
        return e.value.length > 0 ? { stops: e.value, activeIndex: 0 } : null
      }
      if (e.is(clearTabStops)) {
        return null
      }
      if (e.is(advanceTabStop)) {
        if (state) return { ...state, activeIndex: e.value }
      }
    }

    if (!state) return null

    // Map positions through document changes
    if (tr.docChanged) {
      const newStops = state.stops.map(s => ({
        from: tr.changes.mapPos(s.from, 1),
        to: tr.changes.mapPos(s.to, -1),
      }))
      return { stops: newStops, activeIndex: state.activeIndex }
    }

    return state
  },
})

// ── Decorations (highlight active tab-stop) ────────────────

const tabStopMark = Decoration.mark({ class: 'cm-tab-stop' })
const tabStopActiveMark = Decoration.mark({ class: 'cm-tab-stop cm-tab-stop-active' })

const tabStopDecorations = EditorView.decorations.compute([tabStopField], (state) => {
  const ts = state.field(tabStopField)
  if (!ts) return Decoration.none

  const builder = new RangeSetBuilder<Decoration>()
  const sorted = [...ts.stops].map((s, i) => ({ ...s, index: i }))
  sorted.sort((a, b) => a.from - b.from)

  for (const s of sorted) {
    if (s.from < s.to) {
      builder.add(s.from, s.to, s.index === ts.activeIndex ? tabStopActiveMark : tabStopMark)
    }
  }
  return builder.finish()
})

// ── Keymap ─────────────────────────────────────────────────

const tabStopKeymap = keymap.of([
  {
    key: 'Tab',
    run(view: EditorView): boolean {
      const state = view.state.field(tabStopField)
      if (!state) return false

      const nextIndex = state.activeIndex + 1
      if (nextIndex >= state.stops.length) {
        // All stops visited → clear and let Tab do its normal thing
        view.dispatch({ effects: clearTabStops.of(null) })
        return false
      }

      const next = state.stops[nextIndex]
      view.dispatch({
        selection: { anchor: next.from, head: next.to },
        effects: advanceTabStop.of(nextIndex),
      })
      return true
    },
  },
  {
    key: 'Shift-Tab',
    run(view: EditorView): boolean {
      const state = view.state.field(tabStopField)
      if (!state || state.activeIndex <= 0) return false

      const prevIndex = state.activeIndex - 1
      const prev = state.stops[prevIndex]
      view.dispatch({
        selection: { anchor: prev.from, head: prev.to },
        effects: advanceTabStop.of(prevIndex),
      })
      return true
    },
  },
  {
    key: 'Escape',
    run(view: EditorView): boolean {
      if (view.state.field(tabStopField)) {
        view.dispatch({ effects: clearTabStops.of(null) })
        return true
      }
      return false
    },
  },
])

// ── Helper: insert text with tab-stop placeholders ─────────

/**
 * Parse a template string like `\frac{$1}{$2}` and insert it into the
 * editor, setting up tab-stops at the $N placeholder positions.
 *
 * @param view    CodeMirror EditorView
 * @param from    Start position to replace (e.g., where the trigger was)
 * @param to      End position to replace
 * @param template The template string with $1, $2, ... placeholders
 */
export function insertWithTabStops(
  view: EditorView,
  from: number,
  to: number,
  template: string
): void {
  // Parse $1, $2, ... placeholders
  const placeholders: Array<{ index: number; matchStart: number; matchEnd: number }> = []
  const regex = /\$(\d+)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    placeholders.push({
      index: parseInt(match[1], 10),
      matchStart: match.index,
      matchEnd: match.index + match[0].length,
    })
  }

  // Build clean text (without $N markers)
  let cleanText = ''
  let lastEnd = 0
  const stops: TabStop[] = []

  // Sort by position in template
  placeholders.sort((a, b) => a.matchStart - b.matchStart)

  for (const p of placeholders) {
    cleanText += template.slice(lastEnd, p.matchStart)
    const stopFrom = from + cleanText.length
    // Tab-stop is zero-width (cursor position)
    stops.push({ from: stopFrom, to: stopFrom })
    lastEnd = p.matchEnd
  }
  cleanText += template.slice(lastEnd)

  // Dispatch the insertion
  const effects: StateEffect<unknown>[] = []
  if (stops.length > 0) {
    effects.push(setTabStops.of(stops))
  }

  view.dispatch({
    changes: { from, to, insert: cleanText },
    selection: stops.length > 0
      ? { anchor: stops[0].from, head: stops[0].to }
      : { anchor: from + cleanText.length },
    effects,
  })
}

// ── Extension bundle ───────────────────────────────────────

export function tabStopExtension() {
  return [tabStopField, tabStopDecorations, tabStopKeymap]
}
