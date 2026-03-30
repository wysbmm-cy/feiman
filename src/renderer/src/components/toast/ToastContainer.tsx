import React, { useEffect } from 'react'
import { create } from 'zustand'
import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  updateToast: (id: string, updates: Partial<Toast>) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    return id
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  updateToast: (id, updates) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }))
}))

export function useToast() {
  const store = useToastStore()

  return {
    toasts: store.toasts,
    addToast: store.addToast,
    removeToast: store.removeToast,
    updateToast: store.updateToast,
    success: (title: string, description?: string, duration = 3000) =>
      store.addToast({ type: 'success', title, description, duration }),
    error: (title: string, description?: string, duration = 5000) =>
      store.addToast({ type: 'error', title, description, duration }),
    info: (title: string, description?: string, duration = 3000) =>
      store.addToast({ type: 'info', title, description, duration }),
    loading: (title: string, description?: string) =>
      store.addToast({ type: 'loading', title, description, duration: undefined })
  }
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-green-400" />,
  error: <AlertCircle size={18} className="text-red-400" />,
  info: <AlertCircle size={18} className="text-blue-400" />,
  loading: <Loader2 size={18} className="text-yellow-400 animate-spin" />
}

const TOAST_BG: Record<ToastType, string> = {
  success: 'bg-green-500/10 border-green-500/30',
  error: 'bg-red-500/10 border-red-500/30',
  info: 'bg-blue-500/10 border-blue-500/30',
  loading: 'bg-yellow-500/10 border-yellow-500/30'
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const [isExiting, setIsExiting] = React.useState(false)

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => onClose(toast.id), 200)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, toast.id, onClose])

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-300 min-w-[300px] max-w-md ${
        TOAST_BG[toast.type]
      } ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
    >
      <div className="flex-shrink-0">{TOAST_ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-gray-400 mt-0.5">{toast.description}</p>
        )}
      </div>
      {toast.duration && (
        <button
          onClick={() => {
            setIsExiting(true)
            setTimeout(() => onClose(toast.id), 200)
          }}
          className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
