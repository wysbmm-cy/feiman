import { useCallback, useEffect, useState } from 'react'
import { useStore } from '../store'

interface HighlightState {
  nodeId: string | null
  noteRange: { start: number; end: number } | null
}

export function useNodeHighlight() {
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const [highlightedNoteRange, setHighlightedNoteRange] = useState<{ start: number; end: number } | null>(null)
  
  const { activeNote, activeNodes } = useStore()

  // Highlight node when user selects text in notes
  const handleNoteSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setHighlightedNoteRange(null)
      return
    }

    const range = selection.getRangeAt(0)
    const textContent = activeNote?.cornell.notes || ''
    
    // Calculate position in full text
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(range.startContainer)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    const start = preCaretRange.toString().length
    
    const selectedText = range.toString()
    const end = start + selectedText.length
    
    setHighlightedNoteRange({ start, end })
    
    // Find related node based on text similarity
    const relatedNode = findRelatedNode(selectedText, activeNodes)
    if (relatedNode) {
      setHighlightedNode(relatedNode)
    }
  }, [activeNote, activeNodes])

  // Highlight note text when hovering over node
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHighlightedNode(nodeId)
    
    if (nodeId && activeNote) {
      const node = activeNodes.find(n => n.id === nodeId)
      if (node) {
        // Find text range related to this node
        const range = findNodeTextRange(node, activeNote.cornell.notes)
        if (range) {
          setHighlightedNoteRange(range)
        }
      }
    } else {
      setHighlightedNoteRange(null)
    }
  }, [activeNote, activeNodes])

  // Clear highlights
  const clearHighlights = useCallback(() => {
    setHighlightedNode(null)
    setHighlightedNoteRange(null)
  }, [])

  return {
    highlightedNode,
    highlightedNoteRange,
    handleNoteSelection,
    handleNodeHover,
    clearHighlights
  }
}

// Helper: Find related node based on text similarity
function findRelatedNode(text: string, nodes: any[]): string | null {
  if (!text.trim() || nodes.length === 0) return null
  
  const textLower = text.toLowerCase()
  let bestMatch: { nodeId: string; score: number } | null = null
  
  for (const node of nodes) {
    const labelLower = node.label.toLowerCase()
    
    // Exact match
    if (textLower.includes(labelLower) || labelLower.includes(textLower)) {
      return node.id
    }
    
    // Partial match scoring
    let score = 0
    const textWords = textLower.split(/\s+/)
    const labelWords = labelLower.split(/\s+/)
    
    for (const tw of textWords) {
      for (const lw of labelWords) {
        if (tw === lw) score += 2
        else if (tw.includes(lw) || lw.includes(tw)) score += 1
      }
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { nodeId: node.id, score }
    }
  }
  
  return bestMatch?.nodeId || null
}

// Helper: Find text range for a node in notes
function findNodeTextRange(node: any, notes: string): { start: number; end: number } | null {
  if (!notes || !node.label) return null
  
  const notesLower = notes.toLowerCase()
  const labelLower = node.label.toLowerCase()
  
  // Try exact match
  let index = notesLower.indexOf(labelLower)
  if (index !== -1) {
    return { start: index, end: index + node.label.length }
  }
  
  // Try word-by-word matching
  const labelWords = labelLower.split(/\s+/)
  const notesWords = notesLower.split(/\s+/)
  
  for (let i = 0; i <= notesWords.length - labelWords.length; i++) {
    let match = true
    for (let j = 0; j < labelWords.length; j++) {
      if (!notesWords[i + j].includes(labelWords[j]) && !labelWords[j].includes(notesWords[i + j])) {
        match = false
        break
      }
    }
    if (match) {
      // Calculate character positions
      let start = 0
      for (let k = 0; k < i; k++) {
        start += notesWords[k].length + 1 // +1 for space
      }
      let end = start
      for (let k = 0; k < labelWords.length; k++) {
        end += notesWords[i + k].length + 1
      }
      return { start, end: end - 1 }
    }
  }
  
  return null
}
