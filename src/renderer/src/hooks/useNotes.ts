import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { useElectron } from './useElectron'
import type { CornellContent, Note } from '../types'
import { debounce } from '../lib/utils'

function nodeListSignature(nodes: Note['nodes'] | undefined): string {
  const safeNodes = nodes || []
  return safeNodes
    .map((node) => `${node.id}|${node.state}|${node.currentVersion}|${node.updatedAt}`)
    .join(',')
}

function sanitizeLoadedNodes(nodes: Note['nodes'] | undefined): Note['nodes'] {
  return (nodes || []).map((node) => (
    node.state === 'verifying'
      ? { ...node, state: 'unverified' }
      : node
  ))
}

export function useNotes() {
  const api = useElectron()
  const {
    notebooks, notes, activeNote, activeNoteId, activeNodes, isSaving,
    setNotebooks, setNotesMeta, setActiveNote, setLoading, setSaving, setLastSaved,
    setActiveNodes, updateNoteNodes,
    updateCornellContent, addNotebook, addNoteMeta, removeNote
  } = useStore()
  const syncingFromNoteRef = useRef(false)

  // Load all notebooks and note metadata on mount
  const loadNotebooks = useCallback(async () => {
    if (!api) return
    setLoading(true)
    try {
      const res = await api.listNotebooks()
      if (res.success && res.data) {
        const { notebooks: nbs, noteRefs } = res.data as { notebooks: Note['notebookId'][]; noteRefs: Record<string, { filePath: string }> }
        setNotebooks(nbs as unknown as Parameters<typeof setNotebooks>[0])
        // Build metadata map from noteRefs (minimal info for sidebar)
        const metaMap: Record<string, Note> = {}
        for (const [id, ref] of Object.entries(noteRefs || {})) {
          metaMap[id] = { id, filePath: (ref as { filePath: string }).filePath } as unknown as Note
        }
        setNotesMeta(metaMap)
      }
    } finally {
      setLoading(false)
    }
  }, [api, setNotebooks, setNotesMeta, setLoading])

  useEffect(() => { loadNotebooks() }, [loadNotebooks])

  // Load a specific note
  const loadNote = useCallback(async (noteId: string) => {
    if (!api) return
    setLoading(true)
    try {
      const res = await api.readNote(noteId)
      if (res.success && res.data) {
        const rawNote = res.data as unknown as Note
        const note = {
          ...rawNote,
          nodes: sanitizeLoadedNodes(rawNote.nodes)
        }
        setActiveNote(note)
        syncingFromNoteRef.current = true
        setActiveNodes(note.nodes || [])
        window.setTimeout(() => { syncingFromNoteRef.current = false }, 0)
      }
    } finally {
      setLoading(false)
    }
  }, [api, setActiveNote, setActiveNodes, setLoading])

  // Auto-save with debounce
  const saveNote = useCallback(async (note: Note) => {
    if (!api) return
    setSaving(true)
    try {
      await api.writeNote(note as unknown as Parameters<typeof api.writeNote>[0])
      setLastSaved(new Date().toISOString())
    } finally {
      setSaving(false)
    }
  }, [api, setSaving, setLastSaved])

  const debouncedSaveRef = useRef(debounce(saveNote as (...args: unknown[]) => unknown, 2000))
  useEffect(() => {
    debouncedSaveRef.current = debounce(saveNote as (...args: unknown[]) => unknown, 2000)
  }, [saveNote])

  // Hydrate activeNodes when switching notes (single source of truth per note)
  useEffect(() => {
    if (!activeNote) {
      if (activeNodes.length > 0) {
        setActiveNodes([])
      }
      return
    }

    syncingFromNoteRef.current = true
    setActiveNodes(activeNote.nodes || [])
    const timer = window.setTimeout(() => {
      syncingFromNoteRef.current = false
    }, 0)
    return () => window.clearTimeout(timer)
  }, [activeNote?.id, setActiveNodes])

  // Keep note.nodes synchronized with node map edits and persist with debounce
  useEffect(() => {
    if (!activeNote || syncingFromNoteRef.current) return
    if (nodeListSignature(activeNote.nodes) === nodeListSignature(activeNodes)) return

    updateNoteNodes(activeNodes)
    const updated = { ...activeNote, nodes: activeNodes }
    debouncedSaveRef.current(updated)
  }, [activeNodes, activeNote, updateNoteNodes])

  const updateContent = useCallback((partial: Partial<CornellContent>) => {
    updateCornellContent(partial)
    if (activeNote) {
      const updated = { ...activeNote, cornell: { ...activeNote.cornell, ...partial } }
      debouncedSaveRef.current(updated)
    }
  }, [updateCornellContent, activeNote])

  const createNotebook = useCallback(async (name: string, description?: string) => {
    if (!api) return
    const res = await api.createNotebook({ name, description } as Parameters<typeof api.createNotebook>[0])
    if (res.success && res.data) {
      addNotebook(res.data as unknown as Parameters<typeof addNotebook>[0])
    }
    return res
  }, [api, addNotebook])

  const createNote = useCallback(async (notebookId: string, title: string, topic: string) => {
    if (!api) return
    const res = await api.createNote({ notebookId, title, topic })
    if (res.success && res.data) {
      const note = res.data as unknown as Note
      addNoteMeta(note)
      setActiveNote(note)
      setActiveNodes(note.nodes || [])
    }
    return res
  }, [api, addNoteMeta, setActiveNote, setActiveNodes])

  const deleteNote = useCallback(async (noteId: string) => {
    if (!api) return
    const res = await api.deleteNote(noteId)
    if (res.success) {
      removeNote(noteId)
      if (activeNoteId === noteId) {
        setActiveNodes([])
      }
    }
    return res
  }, [api, removeNote, activeNoteId, setActiveNodes])

  return {
    notebooks,
    notes,
    activeNote,
    activeNoteId,
    isSaving,
    loadNote,
    updateContent,
    saveNote,
    createNotebook,
    createNote,
    deleteNote,
    reload: loadNotebooks
  }
}
