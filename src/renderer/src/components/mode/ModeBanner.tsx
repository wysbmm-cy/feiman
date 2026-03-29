import React from 'react'
import { useStore } from '../../store'
import { ModeToggle } from './ModeToggle'

/**
 * ModeIndicator - 模式指示器
 * 
 * 显示当前模式状态的小组件
 * 适合放在标题栏或侧边栏
 */
export function ModeIndicator() {
  const { isCppMode, getModeLabel } = useStore()

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
      style={{
        background: isCppMode() 
          ? 'linear-gradient(135deg, #1a365d, #2c5282)'
          : 'var(--bg-elevated)',
        border: `1px solid ${isCppMode() ? '#3182ce' : 'var(--border-subtle)'}`,
        color: isCppMode() ? '#bee3f8' : 'var(--text-secondary)'
      }}
    >
      {/* 状态指示点 */}
      <span 
        className="w-2 h-2 rounded-full"
        style={{
          background: isCppMode() ? '#48bb78' : 'var(--accent-primary)',
          boxShadow: isCppMode() ? '0 0 8px #48bb78' : 'none'
        }}
      />
      
      {/* 模式名称 */}
      <span>{getModeLabel()}</span>
    </div>
  )
}

/**
 * ModeBanner - 模式横幅
 * 
 * 进入 C++ 模式时显示的欢迎横幅
 */
export function ModeBanner() {
  const { isCppMode, toggleMode } = useStore()

  if (!isCppMode()) return null

  return (
    <div 
      className="relative overflow-hidden rounded-xl p-4 mb-4"
      style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%)',
        border: '1px solid #3182ce'
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-purple-500 blur-3xl" />
      </div>

      {/* 内容 */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 图标 */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3182ce, #2c5282)',
              boxShadow: '0 4px 15px rgba(49, 130, 206, 0.4)'
            }}
          >
            <span className="text-2xl">⚡</span>
          </div>

          {/* 文字 */}
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#bee3f8' }}>
              C++ 专精模式
            </h2>
            <p className="text-sm mt-1" style={{ color: '#90cdf4' }}>
              通过教学对话深度理解 C++ 核心概念
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMode}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
            style={{
              background: 'rgba(49, 130, 206, 0.2)',
              color: '#bee3f8',
              border: '1px solid #3182ce'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(49, 130, 206, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(49, 130, 206, 0.2)'
            }}
          >
            退出 C++ 模式
          </button>
        </div>
      </div>

      {/* 学习进度概览 */}
      <div 
        className="mt-4 pt-4 grid grid-cols-4 gap-4"
        style={{ borderTop: '1px solid rgba(49, 130, 206, 0.3)' }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: '#48bb78' }}>12</div>
          <div className="text-xs mt-1" style={{ color: '#90cdf4' }}>已掌握概念</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: '#ecc94b' }}>5</div>
          <div className="text-xs mt-1" style={{ color: '#90cdf4' }}>学习中</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: '#63b3ed' }}>23</div>
          <div className="text-xs mt-1" style={{ color: '#90cdf4' }}>待解锁</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: '#bee3f8' }}>68%</div>
          <div className="text-xs mt-1" style={{ color: '#90cdf4' }}>总体进度</div>
        </div>
      </div>
    </div>
  )
}
