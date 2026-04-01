import { create } from 'zustand'
import { createNotesSlice, type NotesSlice } from './slices/notes.slice'
import { createAISlice, type AISlice } from './slices/ai.slice'
import { createSettingsSlice, type SettingsSlice } from './slices/settings.slice'
import { createUISlice, type UISlice } from './slices/ui.slice'
import { createNodesSlice, type NodesSlice } from './slices/nodes.slice'
import { createDualAISlice, type DualAISlice } from './slices/dualai.slice'
import { createChatHistorySlice, type ChatHistorySlice } from './slices/chat-history.slice'
import { createVerificationSlice, type VerificationSlice, loadPersistedVerificationData } from './slices/verification.slice'
import { createModeSlice, type ModeSlice } from './slices/mode.slice'
import { createCppSlice, type CppSlice, loadPersistedCppData } from './slices/cpp.slice'
import { createTutorialSlice, type TutorialSlice } from './slices/tutorial.slice'

export type AppStore = NotesSlice & AISlice & SettingsSlice & UISlice & NodesSlice & DualAISlice & ChatHistorySlice & VerificationSlice & ModeSlice & CppSlice & TutorialSlice

const persistedVerificationData = loadPersistedVerificationData()

export const useStore = create<AppStore>((...a) => ({
  ...createNotesSlice(...a),
  ...createAISlice(...a),
  ...createSettingsSlice(...a),
  ...createUISlice(...a),
  ...createNodesSlice(...a),
  ...createDualAISlice(...a),
  ...createChatHistorySlice(...a),
  ...createVerificationSlice(...a),
  ...createModeSlice(...a),
  ...createCppSlice(...a),
  ...createTutorialSlice(...a),
  ...persistedVerificationData,
  ...loadPersistedCppData()
}))
