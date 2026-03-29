import type { StateCreator } from 'zustand'
import type { Note, NoteMetadata, Notebook, CornellContent } from '../../types'
import type { KnowledgeNode } from '../../types/node.types'

export interface NotesSlice {
  notebooks: Notebook[]
  notes: Record<string, NoteMetadata>
  activeNote: Note | null
  activeNoteId: string | null
  isLoading: boolean
  isSaving: boolean
  lastSaved: string | null

  setNotebooks: (notebooks: Notebook[]) => void
  setNotesMeta: (notes: Record<string, NoteMetadata>) => void
  setActiveNote: (note: Note | null) => void
  setActiveNoteId: (id: string | null) => void
  updateCornellContent: (partial: Partial<CornellContent>) => void
  updateNoteTitle: (title: string) => void
  updateNoteTopic: (topic: string) => void
  updateNoteTags: (tags: string[]) => void
  setOverallMastery: (score: number) => void
  updateNoteNodes: (nodes: KnowledgeNode[]) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setLastSaved: (ts: string) => void
  addNotebook: (nb: Notebook) => void
  addNoteMeta: (meta: NoteMetadata) => void
  removeNote: (id: string) => void
}

export const createNotesSlice: StateCreator<NotesSlice, [], [], NotesSlice> = (set) => ({
  notebooks: [],
  notes: {},
  activeNote: null,
  activeNoteId: null,
  isLoading: false,
  isSaving: false,
  lastSaved: null,

  setNotebooks: (notebooks) => set({ notebooks }),
  setNotesMeta: (notes) => set({ notes }),
  setActiveNote: (note) => set({ activeNote: note, activeNoteId: note?.id ?? null }),
  setActiveNoteId: (id) => set({ activeNoteId: id }),

  updateCornellContent: (partial) =>
    set((state) => {
      if (!state.activeNote) return {}
      return {
        activeNote: {
          ...state.activeNote,
          cornell: { ...state.activeNote.cornell, ...partial }
        }
      }
    }),

  updateNoteTitle: (title) =>
    set((state) => {
      if (!state.activeNote) return {}
      return { activeNote: { ...state.activeNote, title } }
    }),

  updateNoteTopic: (topic) =>
    set((state) => {
      if (!state.activeNote) return {}
      return { activeNote: { ...state.activeNote, topic } }
    }),

  updateNoteTags: (tags) =>
    set((state) => {
      if (!state.activeNote) return {}
      return { activeNote: { ...state.activeNote, tags } }
    }),

  setOverallMastery: (score) =>
    set((state) => {
      if (!state.activeNote) return {}
      return { activeNote: { ...state.activeNote, overallMastery: score } }
    }),

  updateNoteNodes: (nodes) =>
    set((state) => {
      if (!state.activeNote) return {}
      return { activeNote: { ...state.activeNote, nodes } }
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (lastSaved) => set({ lastSaved }),

  addNotebook: (nb) =>
    set((state) => ({ notebooks: [...state.notebooks, nb] })),

  addNoteMeta: (meta) =>
    set((state) => ({ notes: { ...state.notes, [meta.id]: meta } })),

  removeNote: (id) =>
    set((state) => {
      const notes = { ...state.notes }
      delete notes[id]
      const notebooks = state.notebooks.map((nb) => ({
        ...nb,
        noteIds: nb.noteIds.filter((nid) => nid !== id)
      }))
      return {
        notes,
        notebooks,
        activeNote: state.activeNote?.id === id ? null : state.activeNote,
        activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
      }
    })
})
