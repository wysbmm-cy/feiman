import type { StateCreator } from 'zustand'
import type { FormulaLayer } from '../../lib/editor/formula-mode'

export interface FormulaModeUI {
  active: boolean
  layer: FormulaLayer
}

export interface UISlice {
  aiPanelOpen: boolean
  settingsOpen: boolean
  sidebarCollapsed: boolean
  activeView: 'editor' | 'welcome'
  studentPanelOpen: boolean
  nodeMapCollapsed: boolean
  newNoteDialogOpen: boolean
  newNotebookDialogOpen: boolean
  newNoteNotebookId: string | null
  formulaMode: FormulaModeUI

  toggleAIPanel: () => void
  setAIPanelOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  toggleSidebar: () => void
  setActiveView: (view: UISlice['activeView']) => void
  setNewNoteDialog: (open: boolean, notebookId?: string) => void
  setNewNotebookDialog: (open: boolean) => void
  setStudentPanelOpen: (open: boolean) => void
  toggleStudentPanel: () => void
  setNodeMapCollapsed: (collapsed: boolean) => void
  setFormulaMode: (mode: FormulaModeUI) => void
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  aiPanelOpen: false,
  settingsOpen: false,
  sidebarCollapsed: false,
  activeView: 'welcome',
  newNoteDialogOpen: false,
  newNotebookDialogOpen: false,
  newNoteNotebookId: null,
  studentPanelOpen: true,
  nodeMapCollapsed: false,
  formulaMode: { active: false, layer: 'formula' as FormulaLayer },

  toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  setAIPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveView: (activeView) => set({ activeView }),
  setNewNoteDialog: (open, notebookId) =>
    set({ newNoteDialogOpen: open, newNoteNotebookId: notebookId ?? null }),
  setNewNotebookDialog: (newNotebookDialogOpen) => set({ newNotebookDialogOpen }),
  setStudentPanelOpen: (studentPanelOpen) => set({ studentPanelOpen }),
  toggleStudentPanel: () => set((state) => ({ studentPanelOpen: !state.studentPanelOpen })),
  setNodeMapCollapsed: (nodeMapCollapsed) => set({ nodeMapCollapsed }),
  setFormulaMode: (formulaMode) => set({ formulaMode }),
})
