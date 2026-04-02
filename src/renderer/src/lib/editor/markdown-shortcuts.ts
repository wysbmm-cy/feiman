/**
 * Extended Markdown formatting keyboard shortcuts.
 *
 * Text Formatting:
 * - Ctrl+B → bold
 * - Ctrl+I → italic
 * - Ctrl+Shift+K → inline code
 * - Ctrl+Shift+7 → ordered list
 * - Ctrl+Shift+8 → unordered list
 * - Ctrl+Shift+C → code block
 * - Ctrl+Q → blockquote
 * - Ctrl+Shift+H → horizontal rule
 * - Ctrl+Shift+L → task list
 *
 * Headers:
 * - Ctrl+1~6 → H1-H6
 *
 * Links & Media:
 * - Ctrl+K → insert link
 * - Ctrl+Shift+I → insert image
 * - Ctrl+Shift+T → insert table
 *
 * Editing:
 * - Ctrl+[ / ] → decrease/increase indent
 * - Ctrl+Shift+U → strikethrough
 * - Ctrl+Shift+M → math formula
 */

import { keymap, EditorView } from '@codemirror/view'

export function wrapSelection(prefix: string, suffix: string) {
  return (view: EditorView): boolean => {
    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)

    // Check if already wrapped → unwrap (toggle)
    if (
      from >= prefix.length &&
      view.state.sliceDoc(from - prefix.length, from) === prefix &&
      view.state.sliceDoc(to, to + suffix.length) === suffix
    ) {
      view.dispatch({
        changes: [
          { from: from - prefix.length, to: from, insert: '' },
          { from: to, to: to + suffix.length, insert: '' },
        ],
        selection: { anchor: from - prefix.length, head: to - prefix.length },
      })
      return true
    }

    // Wrap selection or insert empty wrapper
    if (selected.length > 0) {
      view.dispatch({
        changes: { from, to, insert: prefix + selected + suffix },
        selection: { anchor: from + prefix.length, head: to + prefix.length },
      })
    } else {
      view.dispatch({
        changes: { from, to: from, insert: prefix + suffix },
        selection: { anchor: from + prefix.length },
      })
    }
    return true
  }
}

export function toggleLinePrefix(prefix: string) {
  return (view: EditorView): boolean => {
    const { from, to } = view.state.selection.main
    const doc = view.state.doc
    const startLine = doc.lineAt(from)
    const endLine = doc.lineAt(to)
    
    let changes = []
    let newSelection = { anchor: from, head: to }
    
    for (let pos = startLine.number; pos <= endLine.number; pos++) {
      const line = doc.line(pos)
      const hasPrefix = line.text.startsWith(prefix)
      
      if (hasPrefix) {
        // Remove prefix
        changes.push({
          from: line.from,
          to: line.from + prefix.length,
          insert: ''
        })
        if (pos === startLine.number) {
          newSelection.anchor = Math.max(from - prefix.length, line.from)
        }
        if (pos === endLine.number) {
          newSelection.head = Math.max(to - prefix.length, line.from)
        }
      } else {
        // Add prefix
        changes.push({
          from: line.from,
          to: line.from,
          insert: prefix
        })
        if (pos === startLine.number) {
          newSelection.anchor = from + prefix.length
        }
        if (pos === endLine.number) {
          newSelection.head = to + prefix.length
        }
      }
    }
    
    view.dispatch({
      changes,
      selection: newSelection
    })
    return true
  }
}

export function setHeading(level: number) {
  return (view: EditorView): boolean => {
    const { from, to } = view.state.selection.main
    const doc = view.state.doc
    const startLine = doc.lineAt(from)
    const endLine = doc.lineAt(to)
    
    let changes = []
    const prefix = '#'.repeat(level) + ' '
    
    for (let pos = startLine.number; pos <= endLine.number; pos++) {
      const line = doc.line(pos)
      const match = line.text.match(/^(#{0,6}\s)?(.*)$/)
      const content = match ? match[2] : line.text
      
      changes.push({
        from: line.from,
        to: line.to,
        insert: prefix + content
      })
    }
    
    view.dispatch({ changes })
    return true
  }
}

export function insertLink(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to)
  const insert = selected ? `[${selected}]($1)` : `[链接文本]($1)`
  
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length - 1, head: from + insert.length }
  })
  return true
}

export function insertImage(view: EditorView): boolean {
  const { from } = view.state.selection.main
  const insert = '![图片描述](图片链接)'
  
  view.dispatch({
    changes: { from, to: from, insert },
    selection: { anchor: from + 1, head: from + 5 }
  })
  return true
}

export function insertTable(view: EditorView): boolean {
  const { from } = view.state.selection.main
  const table = `| 列1 | 列2 | 列3 |
|-----|-----|-----|
|     |     |     |
|     |     |     |`
  
  view.dispatch({
    changes: { from, to: from, insert: table }
  })
  return true
}

export function insertHorizontalRule(view: EditorView): boolean {
  const { from } = view.state.selection.main
  view.dispatch({
    changes: { from, to: from, insert: '\n---\n' }
  })
  return true
}

export const markdownShortcuts = keymap.of([
  // Text formatting
  { key: 'Mod-b', run: wrapSelection('**', '**'), preventDefault: true },
  { key: 'Mod-i', run: wrapSelection('*', '*'), preventDefault: true },
  { key: 'Mod-Shift-k', run: wrapSelection('`', '`'), preventDefault: true },
  { key: 'Mod-Shift-u', run: wrapSelection('~~', '~~'), preventDefault: true },
  
  // Headers
  { key: 'Mod-1', run: setHeading(1), preventDefault: true },
  { key: 'Mod-2', run: setHeading(2), preventDefault: true },
  { key: 'Mod-3', run: setHeading(3), preventDefault: true },
  { key: 'Mod-4', run: setHeading(4), preventDefault: true },
  { key: 'Mod-5', run: setHeading(5), preventDefault: true },
  { key: 'Mod-6', run: setHeading(6), preventDefault: true },
  
  // Lists
  { key: 'Mod-Shift-8', run: toggleLinePrefix('- '), preventDefault: true },
  { key: 'Mod-Shift-7', run: toggleLinePrefix('1. '), preventDefault: true },
  { key: 'Mod-Shift-l', run: toggleLinePrefix('- [ ] '), preventDefault: true },
  
  // Indent
  { key: 'Mod-[', run: toggleLinePrefix(''), preventDefault: true },
  { key: 'Mod-]', run: toggleLinePrefix('  '), preventDefault: true },
  
  // Links & Images
  { key: 'Mod-k', run: insertLink, preventDefault: true },
  { key: 'Mod-Shift-i', run: insertImage, preventDefault: true },
  { key: 'Mod-Shift-t', run: insertTable, preventDefault: true },
  
  // Code blocks & Quotes
  { key: 'Mod-Shift-c', run: toggleLinePrefix('    '), preventDefault: true },
  { key: 'Mod-q', run: toggleLinePrefix('> '), preventDefault: true },
  
  // Horizontal rule
  { key: 'Mod-Shift-h', run: insertHorizontalRule, preventDefault: true },
])
