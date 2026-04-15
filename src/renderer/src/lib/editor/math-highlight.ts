/**
 * CodeMirror extension: syntax highlighting for LaTeX math ($...$ and $$...$$).
 *
 * Adds decorations for:
 * - Math delimiters ($, $$) — accent color, dimmed
 * - Math content — special color, monospace
 * - Block math ($$...$$) — background highlight
 */

import { ViewPlugin, Decoration, type DecorationSet, EditorView } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

// ── Theme ──────────────────────────────────────────────────

export const mathHighlightTheme = EditorView.theme({
  '.cm-math-delimiter': {
    color: 'var(--accent-primary)',
    opacity: '0.5',
  },
  '.cm-math-inline': {
    color: 'var(--secondary-color, var(--accent-primary))',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-math-block-line': {
    background: 'color-mix(in srgb, var(--primary-color), transparent 94%)',
    borderLeft: '2px solid var(--accent-muted)',
  },
})

// ── Decorations ────────────────────────────────────────────

const delimiterMark = Decoration.mark({ class: 'cm-math-delimiter' })
const inlineMathMark = Decoration.mark({ class: 'cm-math-inline' })
const blockLineMark = Decoration.line({ class: 'cm-math-block-line' })

// ── ViewPlugin ─────────────────────────────────────────────

const mathHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: { docChanged: boolean; viewportChanged: boolean; view: EditorView }) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations }
)

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const doc = view.state.doc.toString()

  // Track all math regions to avoid overlap
  const regions: Array<{ from: number; to: number; isBlock: boolean }> = []

  // Find block math $$...$$ first (greedy)
  const blockRegex = /\$\$([\s\S]*?)\$\$/g
  let match: RegExpExecArray | null
  while ((match = blockRegex.exec(doc)) !== null) {
    regions.push({ from: match.index, to: match.index + match[0].length, isBlock: true })
  }

  // Find inline math $...$ (not inside block math, not escaped)
  const inlineRegex = /(?<![\\$])\$(?!\$)(.+?)(?<![\\$])\$(?!\$)/g
  while ((match = inlineRegex.exec(doc)) !== null) {
    const from = match.index
    const to = from + match[0].length
    // Skip if inside a block math region
    const insideBlock = regions.some(r => r.isBlock && from >= r.from && to <= r.to)
    if (!insideBlock) {
      regions.push({ from, to, isBlock: false })
    }
  }

  // Sort by position
  regions.sort((a, b) => a.from - b.from)

  // Build decorations
  for (const region of regions) {
    if (region.isBlock) {
      // $$ delimiters
      builder.add(region.from, region.from + 2, delimiterMark)
      builder.add(region.to - 2, region.to, delimiterMark)

      // Content between $$
      if (region.from + 2 < region.to - 2) {
        builder.add(region.from + 2, region.to - 2, inlineMathMark)
      }

      // Line decorations for block math
      const startLine = view.state.doc.lineAt(region.from).number
      const endLine = view.state.doc.lineAt(region.to).number
      for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
        const line = view.state.doc.line(lineNum)
        builder.add(line.from, line.from, blockLineMark)
      }
    } else {
      // $ delimiters
      builder.add(region.from, region.from + 1, delimiterMark)
      builder.add(region.to - 1, region.to, delimiterMark)

      // Content between $
      if (region.from + 1 < region.to - 1) {
        builder.add(region.from + 1, region.to - 1, inlineMathMark)
      }
    }
  }

  return builder.finish()
}

// ── Extension bundle ───────────────────────────────────────

export function mathHighlightExtension() {
  return [mathHighlightTheme, mathHighlighter]
}
