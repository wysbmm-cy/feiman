import React from 'react'
import { useStore } from '../../store'
import { LANGUAGE_CONFIGS } from '../../types/code-teaching.types'

/**
 * ModeIndicator - 模式指示器
 * 
 * 显示当前模式状态的小组件
 * 适合放在标题栏或侧边栏
 */
export function ModeIndicator() {
  const { mode, currentLanguage, getModeLabel } = useStore()
  const isCode = mode === 'code'
  const config = currentLanguage ? LANGUAGE_CONFIGS[currentLanguage] : null

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
      style={{
        background: isCode && config
          ? config.gradient
          : 'var(--bg-elevated)',
        border: `1px solid ${isCode && config ? config.color : 'var(--border-subtle)'}`,
        color: isCode && config ? '#fff' : 'var(--text-secondary)'
      }}
    >
      {/* 状态指示点 */}
      <span 
        className="w-2 h-2 rounded-full"
        style={{
          background: isCode && config ? '#48bb78' : 'var(--accent-primary)',
          boxShadow: isCode && config ? '0 0 8px #48bb78' : 'none'
        }}
      />
      
      {/* 图标 */}
      {config && <span>{config.icon}</span>}
      
      {/* 模式名称 */}
      <span>{getModeLabel()}</span>
    </div>
  )
}

/**
 * ModeBanner - 模式横幅
 * 
 * 进入编程模式时显示的欢迎横幅
 */
export function ModeBanner() {
  const { mode, currentLanguage, toggleMode } = useStore()
  const isCode = mode === 'code'
  const config = currentLanguage ? LANGUAGE_CONFIGS[currentLanguage] : null

  if (!isCode || !config) return null

  return (
    <div 
      className="relative overflow-hidden rounded-xl p-4 mb-4"
      style={{
        background: config.gradient,
        border: `1px solid ${config.color}`
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl"
          style={{ background: config.color }}
        />
        <div 
          className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl"
          style={{ background: config.color }}
        />
      </div>

      {/* 内容 */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 图标 */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: `${config.color}40`,
              boxShadow: `0 4px 15px ${config.color}60`
            }}
          >
            {config.icon}
          </div>

          {/* 文字 */}
          <div>
            <h2 className="text-xl font-bold text-white">
              {config.displayName} 专精模式
            </h2>
            <p className="text-sm mt-1 opacity-90">
              {config.description}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMode}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-white"
            style={{
              background: `${config.color}40`,
              border: `1px solid ${config.color}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${config.color}60`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${config.color}40`
            }}
          >
            退出编程模式
          </button>
        </div>
      </div>

      {/* 特性标签 */}
      <div 
        className="mt-4 pt-4 flex flex-wrap gap-2"
        style={{ borderTop: `1px solid ${config.color}40` }}
      >
        {config.features.map(feature => (
          <span
            key={feature}
            className="px-2 py-1 rounded-md text-xs font-medium text-white"
            style={{ 
              background: `${config.color}30`,
              border: `1px solid ${config.color}50`
            }}
          >
            {feature}
          </span>
        ))}
      </div>

      {/* 学习进度概览 */}
      <div 
        className="mt-4 pt-4 grid grid-cols-4 gap-4"
        style={{ borderTop: `1px solid ${config.color}40` }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-white">12</div>
          <div className="text-xs mt-1 opacity-80">已掌握概念</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-300">5</div>
          <div className="text-xs mt-1 opacity-80">学习中</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-200">23</div>
          <div className="text-xs mt-1 opacity-80">待解锁</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-300">68%</div>
          <div className="text-xs mt-1 opacity-80">总体进度</div>
        </div>
      </div>
    </div>
  )
}
