import type { StateCreator } from 'zustand'
import type { AIMessage } from '../../types'

export interface AISlice {
  messages: AIMessage[]
  isStreaming: boolean
  streamingMessageId: string | null

  addMessage: (msg: AIMessage) => void
  updateStreamingMessage: (id: string, chunk: string) => void
  updateStreamingReasoning: (id: string, chunk: string) => void
  setMessageContent: (id: string, content: string) => void
  finalizeStreamingMessage: (id: string) => void
  clearMessages: () => void
  setStreaming: (streaming: boolean) => void
  setStreamingMessageId: (id: string | null) => void
}

export const createAISlice: StateCreator<AISlice, [], [], AISlice> = (set) => ({
  messages: [],
  isStreaming: false,
  streamingMessageId: null,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  updateStreamingMessage: (id, chunk) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + chunk } : m
      )
    })),

  updateStreamingReasoning: (id, chunk) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, reasoning: (m.reasoning || '') + chunk } : m
      )
    })),

  setMessageContent: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      )
    })),

  finalizeStreamingMessage: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isStreaming: false } : m
      ),
      isStreaming: false,
      streamingMessageId: null
    })),

  clearMessages: () => set({ messages: [] }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingMessageId: (id) => set({ streamingMessageId: id })
})
