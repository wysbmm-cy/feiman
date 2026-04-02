/**
 * RAG client — calls the main process RAG IPC handlers from the renderer.
 */

import type { RagSearchResult } from '../../../../shared/ipc-types'

// window.electronAPI is typed via the preload bridge
declare global {
  interface Window {
    electronAPI: {
      ragSearch: (query: string, topK?: number) => Promise<{ success: boolean; data?: RagSearchResult[]; error?: string }>
    }
  }
}

/**
 * Search the RAG index for relevant note chunks.
 * Returns [] if RAG is unavailable or an error occurs.
 */
export async function searchNotes(query: string, topK = 3): Promise<RagSearchResult[]> {
  try {
    const electronAPI = (window as any).electronAPI
    if (!electronAPI?.ragSearch) return []
    const res = await electronAPI.ragSearch(query, topK)
    if (res?.success && Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch {
    return []
  }
}

/**
 * Format RAG results into a context block to inject into the system prompt.
 * Returns empty string if there are no results.
 */
export function formatRagContext(results: RagSearchResult[], excludeNoteId?: string): string {
  const filtered = excludeNoteId ? results.filter(r => r.noteId !== excludeNoteId) : results
  if (!filtered || filtered.length === 0) return ''

  const chunks = filtered.map((r) => {
    const isFile = !r.noteId || r.noteId === ''
    const sourceLabel = isFile ? `知识库文件: ${r.noteTitle}` : `已有笔记: ${r.noteTitle}`
    const sectionLabel = r.section === 'cues' ? '关键词' : r.section === 'summary' ? '总结' : '正文'
    
    return `[来源: ${sourceLabel} | 版块: ${sectionLabel}]\n${r.text.trim()}`
  })
  
  return `\n\n---\n【系统指令：以下是检索到的参考知识。如果用户当前问及相关概念，请务必参考这些真实资料进行回答，以确保专业性和准确性。若资料与用户讲解有偏差，请委婉指出。】\n\n${chunks.join('\n\n---\n\n')}\n---`
}
