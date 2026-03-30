import React from 'react'
import { Mic } from 'lucide-react'
import { checkWebSpeechSupport } from '../../lib/audio/speech-recognition'
import { useStore } from '../../store'

/**
 * 语音输入调试组件 - 用于诊断按钮不显示的问题
 */
export function VoiceInputDebug() {
  const { settings } = useStore()
  
  // 检查各项配置
  const hasAIProvider = settings.aiProviders?.some(p => p.apiKey) ?? false
  const webSpeechSupported = checkWebSpeechSupport()
  const activeProviderId = settings.activeProviderId
  
  // 如果没有可用的语音识别方式，显示警告
  if (!hasAIProvider && !webSpeechSupported) {
    return (
      <div 
        className="px-2 py-1 rounded text-xs flex items-center gap-1.5"
        style={{ 
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}
        title="请在设置中配置 AI Provider 或使用支持语音识别的浏览器"
      >
        <span>🎤 语音输入不可用</span>
      </div>
    )
  }
  
  // 正常显示语音输入按钮（简化版，确保可见）
  return (
    <div className="flex items-center gap-2">
      {/* 简化的语音按钮 - 使用内联样式确保可见 */}
      <button
        onClick={() => {
          // 触发自定义事件，让 VoiceInput 组件处理
          window.dispatchEvent(new CustomEvent('trigger-voice-input'))
        }}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
        style={{ 
          background: '#3b82f6',
          color: '#ffffff',
          border: '2px solid #2563eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          minWidth: '80px',
          fontSize: '14px',
          fontWeight: 500
        }}
        title="语音输入 (Ctrl+Shift+V)"
      >
        <Mic size={18} />
        <span>语音</span>
      </button>
      
      {/* 显示当前可用的语音识别方式 */}
      <div 
        className="text-xs px-2 py-1 rounded"
        style={{ 
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#22c55e'
        }}
      >
        {hasAIProvider && webSpeechSupported 
          ? '✓ AI + 浏览器语音'
          : hasAIProvider 
            ? '✓ AI 语音'
            : '✓ 浏览器语音'
        }
      </div>
    </div>
  )
}

export default VoiceInputDebug
