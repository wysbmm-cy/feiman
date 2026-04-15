import type { StateCreator } from 'zustand'
import type { KnowledgeNode, NodeState, NodeVersion } from '../../types/node.types'
import { v4 as uuidv4 } from 'uuid'

export interface NodesSlice {
  // Active note's nodes
  activeNodes: KnowledgeNode[]
  selectedNodeId: string | null
  asyncResults: { nodeId: string; passed: boolean; message: string; timestamp: string }[]

  setActiveNodes: (nodes: KnowledgeNode[]) => void
  setSelectedNode: (id: string | null) => void
  addNode: (node: KnowledgeNode) => void
  updateNode: (id: string, updates: Partial<KnowledgeNode>) => void
  removeNode: (id: string) => void
  setNodeState: (id: string, state: NodeState) => void
  addNodeVersion: (id: string, version: NodeVersion) => void
  rollbackNodeVersion: (id: string, versionId: string) => void
  setNodeMastery: (id: string, score: number) => void
  updateNodePosition: (id: string, x: number, y: number) => void
  createNode: (label: string, cueRef?: string) => KnowledgeNode
  appealNode: (id: string, reason: string) => void
  addAsyncResult: (result: { nodeId: string; passed: boolean; message: string; timestamp: string }) => void
  clearAsyncResult: (nodeId: string) => void
}

export const createNodesSlice: StateCreator<NodesSlice, [], [], NodesSlice> = (set, get) => ({
  activeNodes: [],
  selectedNodeId: null,
  asyncResults: [],

  setActiveNodes: (nodes) => set({ activeNodes: nodes }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),

  addNode: (node) =>
    set((state) => ({ activeNodes: [...state.activeNodes, node] })),

  updateNode: (id, updates) =>
    set((state) => ({
      activeNodes: state.activeNodes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    })),

  removeNode: (id) =>
    set((state) => ({
      activeNodes: state.activeNodes.filter((n) => n.id !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
    })),

  setNodeState: (id, nodeState) =>
    set((state) => ({
      activeNodes: state.activeNodes.map((n) =>
        n.id === id ? { ...n, state: nodeState, updatedAt: new Date().toISOString() } : n
      )
    })),

  addNodeVersion: (id, version) =>
    set((state) => ({
      activeNodes: state.activeNodes.map((n) => {
        if (n.id !== id) return n
        const versions = [...n.versions, version]
        return {
          ...n,
          versions,
          currentVersion: versions.length - 1,
          state: version.passed ? 'verified' : 'failed',
          masteryScore: version.expertFeedback.score,
          updatedAt: new Date().toISOString()
        }
      })
    })),

  rollbackNodeVersion: (id, versionId) =>
    set((state) => ({
      activeNodes: state.activeNodes.map((n) => {
        if (n.id !== id) return n
        const targetIndex = n.versions.findIndex((v) => v.versionId === versionId)
        if (targetIndex === -1) return n
        const targetVersion = n.versions[targetIndex]
        return {
          ...n,
          currentVersion: targetIndex,
          state: targetVersion.passed ? 'verified' : 'failed',
          masteryScore: targetVersion.expertFeedback.score,
          updatedAt: new Date().toISOString()
        }
      })
    })),

  setNodeMastery: (id, score) =>
    set((state) => ({
      activeNodes: state.activeNodes.map((n) =>
        n.id === id ? { ...n, masteryScore: score, updatedAt: new Date().toISOString() } : n
      )
    })),

  updateNodePosition: (id, x, y) =>
    set((state) => ({
      activeNodes: state.activeNodes.map((n) =>
        n.id === id ? { ...n, position: { x, y } } : n
      )
    })),

  createNode: (label, cueRef) => {
    const now = new Date().toISOString()
    // Auto-layout: place new nodes in a grid
    const count = get().activeNodes.length
    const cols = 4
    const x = (count % cols) * 160 + 80
    const y = Math.floor(count / cols) * 120 + 60

    const node: KnowledgeNode = {
      id: uuidv4(),
      label,
      type: 'concept',
      state: 'unverified',
      verificationMode: 'sync_block',
      cornellCueRef: cueRef,
      position: { x, y },
      dependencies: [],
      versions: [],
      currentVersion: -1,
      createdAt: now,
      updatedAt: now
    }
    return node
  },

  appealNode: (id, reason) =>
    set((state) => ({
      activeNodes: state.activeNodes.map((n) => {
        if (n.id !== id) return n
        const now = new Date().toISOString()
        const latestVersion = n.versions[n.versions.length - 1]
        if (!latestVersion) {
          return {
            ...n,
            state: 'verified',
            updatedAt: now
          }
        }

        const appealVersion: NodeVersion = {
          ...latestVersion,
          versionId: uuidv4(),
          attempt: latestVersion.attempt + 1,
          createdAt: now,
          passed: true,
          appealReason: reason,
          expertFeedback: {
            ...latestVersion.expertFeedback,
            passed: true,
            score: Math.max(latestVersion.expertFeedback.score, 75)
          }
        }

        const versions = [...n.versions, appealVersion]
        return {
          ...n,
          versions,
          currentVersion: versions.length - 1,
          state: 'verified',
          masteryScore: appealVersion.expertFeedback.score,
          updatedAt: new Date().toISOString()
        }
      })
    })),

  addAsyncResult: (result) =>
    set((state) => ({
      asyncResults: [...state.asyncResults, result]
    })),

  clearAsyncResult: (nodeId) =>
    set((state) => ({
      asyncResults: state.asyncResults.filter(r => r.nodeId !== nodeId)
    }))
})
