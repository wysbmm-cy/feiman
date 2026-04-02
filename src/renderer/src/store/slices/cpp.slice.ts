import { StateCreator } from 'zustand'
import { CppFile, CppVersion } from '../../types/cpp-teaching.types'

export interface CppSlice {
  cppFiles: CppFile[]
  activeCppFileId: string | null
  
  addCppFile: () => string
  deleteCppFile: (id: string) => void
  updateCppFile: (id: string, updates: Partial<CppFile>, saveVersion?: boolean, versionDesc?: string) => void
  setActiveCppFileId: (id: string | null) => void
  saveCppVersion: (id: string, description?: string, isSync?: boolean) => void
  rollbackCppVersion: (fileId: string, versionId: string) => void
  loadCppFiles: () => void
}

export const createCppSlice: StateCreator<CppSlice, [], [], CppSlice> = (set, get) => ({
  cppFiles: [],
  activeCppFileId: null,

  addCppFile: () => {
    const { cppFiles } = get()
    const newFile: CppFile = {
      id: `cpp-${Date.now()}`,
      name: `untitled-${cppFiles.length + 1}.cpp`,
      code: '',
      createdAt: new Date().toISOString(),
      versions: []
    }
    set({
      cppFiles: [...cppFiles, newFile],
      activeCppFileId: newFile.id
    })
    get().loadCppFiles() // Trigger save
    return newFile.id
  },

  deleteCppFile: (id) => {
    const { cppFiles, activeCppFileId } = get()
    const newFiles = cppFiles.filter(f => f.id !== id)
    set({
      cppFiles: newFiles,
      activeCppFileId: activeCppFileId === id ? (newFiles[0]?.id || null) : activeCppFileId
    })
    get().loadCppFiles() // Trigger save
  },

  updateCppFile: (id, updates, saveVersion = false, versionDesc) => {
    const { cppFiles, saveCppVersion } = get()
    
    // 如果需要保存版本，先保存当前状态
    if (saveVersion) {
      saveCppVersion(id, versionDesc || '自动保存')
    }

    set({
      cppFiles: cppFiles.map(f => f.id === id ? { ...f, ...updates } : f)
    })
    get().loadCppFiles() // Trigger save
  },

  saveCppVersion: (id, description, isSync = false) => {
    const { cppFiles } = get()
    const file = cppFiles.find(f => f.id === id)
    if (!file) return

    const newVersion: CppVersion = {
      id: `v-${Date.now()}`,
      code: file.code,
      timestamp: new Date().toISOString(),
      description: description || (isSync ? 'AI 同步' : '手动保存'),
      isSync
    }

    set({
      cppFiles: cppFiles.map(f => 
        f.id === id 
          ? { ...f, versions: [newVersion, ...(f.versions || [])].slice(0, 50) } // 最多保留50个版本
          : f
      )
    })
    get().loadCppFiles()
  },

  rollbackCppVersion: (fileId, versionId) => {
    const { cppFiles } = get()
    const file = cppFiles.find(f => f.id === fileId)
    if (!file) return

    const version = file.versions?.find((v: CppVersion) => v.id === versionId)
    if (!version) return

    set({
      cppFiles: cppFiles.map(f => 
        f.id === fileId 
          ? { ...f, code: version.code } 
          : f
      )
    })
    get().loadCppFiles()
  },

  setActiveCppFileId: (id) => set({ activeCppFileId: id }),

  loadCppFiles: () => {
    // This function acts as a trigger to save to localStorage for now
    // In a real app we might use a persist middleware, but following the existing pattern
    const { cppFiles, activeCppFileId } = get()
    if (typeof window !== 'undefined') {
      localStorage.setItem('cpp-files', JSON.stringify({ files: cppFiles, activeFileId: activeCppFileId }))
    }
  }
})

export const loadPersistedCppData = () => {
  if (typeof window === 'undefined') return { cppFiles: [], activeCppFileId: null }
  const saved = localStorage.getItem('cpp-files')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return {
        cppFiles: parsed.files || [],
        activeCppFileId: parsed.activeFileId || null
      }
    } catch (e) {
      console.error('Failed to load cpp files:', e)
    }
  }
  return { cppFiles: [], activeCppFileId: null }
}
