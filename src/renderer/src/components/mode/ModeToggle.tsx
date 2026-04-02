import React, { useState } from 'react'
import { useStore } from '../../store'
import { Terminal, BookOpen, ChevronDown, Code2 } from 'lucide-react'
import { LANGUAGE_CONFIGS, type ProgrammingLanguage } from '../../types/code-teaching.types'

export function ModeToggle() {
  const mode = useStore(state => state.mode)
  const currentLanguage = useStore(state => state.currentLanguage)
  const setMode = useStore(state => state.setMode)
  const setCurrentLanguage = useStore(state => state.setCurrentLanguage)
  const setActiveView = useStore(state => state.setActiveView)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const isCode = mode === 'code'
  const currentConfig = currentLanguage ? LANGUAGE_CONFIGS[currentLanguage] : null

  const handleToggle = () => {
    if (!isCode) {
      // 切换到编程模式，默认选择 C++
      setMode('code')
      if (!currentLanguage) {
        setCurrentLanguage('cpp')
      }
      setActiveView('editor')
    } else {
      // 退出编程模式
      setMode('general')
      setShowLanguageMenu(false)
    }
  }

  const handleLanguageSelect = (lang: ProgrammingLanguage) => {
    setCurrentLanguage(lang)
    setShowLanguageMenu(false)
  }

  return (
    <div className="relative flex items-center" data-tutorial="mode-toggle">
      {/* 主按钮 */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-l-lg text-sm font-medium transition-all duration-300"
        style={{
          background: isCode && currentConfig
            ? currentConfig.gradient
            : 'var(--bg-elevated)',
          color: isCode && currentConfig ? '#fff' : 'var(--text-secondary)',
          border: `1px solid ${isCode && currentConfig ? currentConfig.color : 'var(--border-subtle)'}`,
          borderRight: isCode ? 'none' : undefined,
          boxShadow: isCode && currentConfig ? `0 0 15px ${currentConfig.color}40` : 'none',
          borderRadius: isCode ? '0.5rem 0 0 0.5rem' : '0.5rem'
        }}
      >
        {isCode && currentConfig ? (
          <>
            <span className="text-base">{currentConfig.icon}</span>
            <span>{currentConfig.displayName}</span>
          </>
        ) : (
          <>
            <BookOpen size={16} />
            <span>通用模式</span>
          </>
        )}
      </button>

      {/* 编程模式时显示下拉菜单按钮 */}
      {isCode && (
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="flex items-center justify-center px-2 py-1.5 rounded-r-lg transition-all duration-300"
          style={{
            background: currentConfig?.gradient || 'var(--bg-elevated)',
            color: '#fff',
            border: `1px solid ${currentConfig?.color || 'var(--border-subtle)'}`,
            borderLeft: 'none',
            boxShadow: currentConfig ? `0 0 15px ${currentConfig.color}40` : 'none'
          }}
        >
          <ChevronDown 
            size={14} 
            style={{ 
              transform: showLanguageMenu ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }} 
          />
        </button>
      )}

      {/* 语言选择菜单 */}
      {showLanguageMenu && (
        <div 
          className="absolute top-full right-0 mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden z-50"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div 
            className="px-3 py-2 text-xs font-medium border-b"
            style={{ 
              color: 'var(--text-muted)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            选择编程语言
          </div>
          <div className="py-1">
            {(Object.keys(LANGUAGE_CONFIGS) as ProgrammingLanguage[]).map(lang => {
              const config = LANGUAGE_CONFIGS[lang]
              const isSelected = currentLanguage === lang
              
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200"
                  style={{
                    background: isSelected ? `${config.color}20` : 'transparent',
                    color: isSelected ? config.color : 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-elevated)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span className="text-lg">{config.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{config.displayName}</div>
                    <div className="text-xs opacity-60 truncate">{config.description}</div>
                  </div>
                  {isSelected && (
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: config.color }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 点击外部关闭菜单 */}
      {showLanguageMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLanguageMenu(false)}
        />
      )}
    </div>
  )
}
