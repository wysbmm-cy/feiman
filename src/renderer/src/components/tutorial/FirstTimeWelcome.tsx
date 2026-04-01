import React, { useState, useEffect } from 'react'
import { Sparkles, BookOpen, Play, HelpCircle, X } from 'lucide-react'
import { useStore } from '../../store'

interface FirstTimeWelcomeProps {
  open: boolean
  onClose: () => void
}

export function FirstTimeWelcome({ open, onClose }: FirstTimeWelcomeProps) {
  const { startTutorial, setSettingsOpen } = useStore()
  const [isMounted, setIsMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])
  
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [open])
  
  if (!open || !isMounted) return null
  
  const handleStartTutorial = () => {
    setVisible(false)
    setTimeout(() => {
      onClose()
      startTutorial()
    }, 300)
  }
  
  const handleSkipToSettings = () => {
    setVisible(false)
    setTimeout(() => {
      onClose()
      setSettingsOpen(true)
    }, 300)
  }
  
  const handleJustExplore = () => {
    setVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }
  
  return (
    <div 
      className={`fixed inset-0 z-[2000] flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        className={`w-full max-w-lg transform transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card */}
        <div 
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}
        >
          {/* Close button */}
          <button
            onClick={handleJustExplore}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors z-10"
          >
            <X size={16} />
          </button>
          
          {/* Header with animated gradient */}
          <div 
            className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
            }}
          >
            {/* Animated particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-blue-400/40"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    animation: `welcome-particle ${2 + Math.random() * 2}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 1.5}s`
                  }}
                />
              ))}
            </div>
            
            {/* Logo */}
            <div 
              className="relative mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Sparkles size={32} className="text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              欢迎来到 Anything Feynman
            </h1>
            <p className="text-sm text-gray-400">
              这是你第一次使用吗？
            </p>
          </div>
          
          {/* Options */}
          <div className="px-6 pb-6 space-y-3">
            {/* Primary option */}
            <button
              onClick={handleStartTutorial}
              className="w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  <Play size={20} className="text-white ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-white">是的，开始新手引导</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300">
                      推荐
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    3分钟快速了解核心功能，帮助你快速上手
                  </p>
                </div>
              </div>
            </button>
            
            {/* Secondary option */}
            <button
              onClick={handleSkipToSettings}
              className="w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:bg-gray-700/30"
              style={{
                background: 'rgba(55, 65, 81, 0.2)',
                border: '1px solid rgba(75, 85, 99, 0.3)'
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-700/50"
                >
                  <BookOpen size={20} className="text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-base font-semibold text-gray-200">我已了解，直接配置 AI</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    跳过引导，直接进入设置配置 API Key
                  </p>
                </div>
              </div>
            </button>
            
            {/* Tertiary option */}
            <button
              onClick={handleJustExplore}
              className="w-full text-center py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              先自己探索一下
            </button>
          </div>
          
          {/* Footer hint */}
          <div 
            className="px-6 py-3 border-t text-center"
            style={{ borderColor: 'rgba(75, 85, 99, 0.2)' }}
          >
            <p className="text-xs text-gray-500">
              💡 随时点击标题栏的 <HelpCircle size={10} className="inline mx-0.5" /> 图标查看帮助或重新开始引导
            </p>
          </div>
        </div>
        
        {/* Animation styles */}
        <style>{`
          @keyframes welcome-particle {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
            50% { transform: translateY(-15px) scale(1.5); opacity: 0.8; }
          }
        `}</style>
      </div>
    </div>
  )
}

export default FirstTimeWelcome
