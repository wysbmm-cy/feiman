import React, { useEffect, useState } from 'react'
import { Keyboard, X } from 'lucide-react'

interface Shortcut {
  category: string
  items: { keys: string; description: string }[]
}

const SHORTCUTS: Shortcut[] = [
  {
    category: '编辑器',
    items: [
      { keys: 'Ctrl/Cmd + S', description: '保存笔记' },
      { keys: 'Ctrl/Cmd + M', description: '切换公式模式' },
      { keys: 'Shift + Ctrl/Cmd + M', description: '块级公式模式' },
      { keys: 'F9', description: '快速插入公式' },
      { keys: 'Ctrl/Cmd + Shift + V', description: '语音输入' }
    ]
  },
  {
    category: '界面导航',
    items: [
      { keys: 'Ctrl/Cmd + \\', description: '切换学生面板' },
      { keys: 'Ctrl/Cmd + Shift + N', description: 'AI 自动创建节点' },
      { keys: 'Ctrl/Cmd + B', description: '切换侧边栏' }
    ]
  },
  {
    category: '对话',
    items: [
      { keys: 'Enter', description: '发送消息' },
      { keys: 'Shift + Enter', description: '换行' },
      { keys: 'Escape', description: '取消输入/关闭对话框' }
    ]
  }
]

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!open || !isMounted) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-gray-700/50 bg-[#161b22] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <Keyboard size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">快捷键帮助</h2>
              <p className="text-xs text-gray-400">快速上手指南</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUTS.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg bg-gray-800/30 border border-gray-700/30"
                    >
                      <span className="text-sm text-gray-300">{item.description}</span>
                      <kbd className="px-2 py-1 text-[10px] font-mono rounded-md bg-gray-800 text-gray-400 border border-gray-600 whitespace-nowrap">
                        {item.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 使用提示</h4>
            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
              <li>公式模式下可以使用 LaTeX 语法输入数学公式</li>
              <li>学生面板可以切换 AI 角色（学生/专家）</li>
              <li>节点地图支持拖拽排列，自动对齐辅助线</li>
              <li>长按语音按钮可以实时录音转文字</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-800/30">
          <p className="text-xs text-gray-500 text-center">
            按 <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-700 text-gray-400">Esc</kbd> 关闭
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsModal
