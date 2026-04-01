import React, { useEffect, useState, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, SkipForward, Sparkles, Settings } from 'lucide-react'
import { useStore } from '../../store'
import { TUTORIAL_STEPS, type TutorialStep } from '../../store/slices/tutorial.slice'

interface SpotlightRect {
  x: number
  y: number
  width: number
  height: number
}

export function TutorialOverlay() {
  const { 
    tutorialActive, 
    tutorialStep, 
    nextStep, 
    prevStep, 
    skipTutorial,
    getProgress,
    isFirstStep,
    isLastStep
  } = useStore()
  
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)
  const [targetVisible, setTargetVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  const currentStep = TUTORIAL_STEPS[tutorialStep]
  const progress = getProgress()
  
  // Calculate spotlight and tooltip position
  const updatePositions = useCallback(() => {
    if (!currentStep) return
    
    if (!currentStep.targetSelector) {
      // Center mode - no spotlight
      setSpotlight(null)
      setTooltipPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      setTargetVisible(true)
      return
    }
    
    const target = document.querySelector(currentStep.targetSelector)
    if (!target) {
      // Target not found, skip to next step after a short delay
      setTimeout(() => {
        const retryTarget = document.querySelector(currentStep.targetSelector)
        if (!retryTarget && tutorialActive) {
          nextStep()
        }
      }, 500)
      return
    }
    
    // Show target first
    setTargetVisible(true)
    
    const rect = target.getBoundingClientRect()
    const padding = 8
    
    setSpotlight({
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    })
    
    // Calculate tooltip position
    const tooltipWidth = 360
    const tooltipHeight = 200
    const gap = 16
    
    let x = 0
    let y = 0
    
    switch (currentStep.position) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2
        y = rect.top - tooltipHeight - gap
        break
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2
        y = rect.bottom + gap
        break
      case 'left':
        x = rect.left - tooltipWidth - gap
        y = rect.top + rect.height / 2 - tooltipHeight / 2
        break
      case 'right':
        x = rect.right + gap
        y = rect.top + rect.height / 2 - tooltipHeight / 2
        break
      default:
        x = rect.left + rect.width / 2 - tooltipWidth / 2
        y = rect.bottom + gap
    }
    
    // Keep tooltip in viewport
    x = Math.max(16, Math.min(x, window.innerWidth - tooltipWidth - 16))
    y = Math.max(16, Math.min(y, window.innerHeight - tooltipHeight - 16))
    
    setTooltipPos({ x, y })
  }, [currentStep, tutorialActive, nextStep])
  
  useEffect(() => {
    if (tutorialActive) {
      // Small delay for animation
      const showTimer = setTimeout(() => setVisible(true), 50)
      updatePositions()
      
      window.addEventListener('resize', updatePositions)
      window.addEventListener('scroll', updatePositions, true)
      
      return () => {
        clearTimeout(showTimer)
        window.removeEventListener('resize', updatePositions)
        window.removeEventListener('scroll', updatePositions, true)
      }
    } else {
      setVisible(false)
      setTargetVisible(false)
    }
  }, [tutorialActive, tutorialStep, updatePositions])
  
  if (!tutorialActive || !currentStep) return null
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking on the overlay, not the spotlight area
    if (spotlight) {
      const clickX = e.clientX
      const clickY = e.clientY
      const inSpotlight = 
        clickX >= spotlight.x && 
        clickX <= spotlight.x + spotlight.width &&
        clickY >= spotlight.y && 
        clickY <= spotlight.y + spotlight.height
      
      if (inSpotlight) {
        // Allow clicking the highlighted element
        const target = document.querySelector(currentStep.targetSelector)
        if (target) {
          (target as HTMLElement).click()
        }
      }
    }
  }
  
  const isCenter = currentStep.position === 'center'
  
  return (
    <div 
      className={`fixed inset-0 z-[1000] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleOverlayClick}
    >
      {/* Spotlight mask using SVG */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect 
                x={spotlight.x} 
                y={spotlight.y} 
                width={spotlight.width} 
                height={spotlight.height}
                fill="black"
                rx="8"
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#tutorial-mask)"
          style={{ pointerEvents: 'auto' }}
        />
      </svg>
      
      {/* Highlight border around spotlight */}
      {spotlight && targetVisible && (
        <div
          className="absolute rounded-lg pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: spotlight.x,
            top: spotlight.y,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 2px var(--accent-primary), 0 0 20px rgba(var(--accent-primary-rgb), 0.5)',
            animation: 'pulse-border 2s ease-in-out infinite'
          }}
        />
      )}
      
      {/* Center mode backdrop */}
      {isCenter && (
        <div 
          className="absolute inset-0 bg-black/70"
          style={{ pointerEvents: 'auto' }}
        />
      )}
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`absolute transition-all duration-300 ease-out ${targetVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          left: isCenter ? '50%' : tooltipPos.x,
          top: isCenter ? '50%' : tooltipPos.y,
          transform: isCenter ? 'translate(-50%, -50%)' : 'none',
          width: isCenter ? 420 : 360
        }}
      >
        <div 
          className="rounded-2xl overflow-hidden shadow-2xl border"
          style={{ 
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
            borderColor: 'color-mix(in srgb, var(--accent-primary), transparent 60%)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Header */}
          <div 
            className="px-5 py-4 flex items-center gap-3 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'var(--accent-muted)' }}
            >
              {currentStep.icon || '✨'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-100">{currentStep.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex gap-1">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        i === tutorialStep 
                          ? 'w-4 bg-blue-500' 
                          : i < tutorialStep 
                            ? 'bg-blue-500/60' 
                            : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{progress.current}/{progress.total}</span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); skipTutorial() }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
              title="跳过教程"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Content */}
          <div className="px-5 py-4">
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {currentStep.description}
            </p>
            
            {currentStep.action && (
              <div 
                className="mt-3 px-3 py-2 rounded-lg text-xs"
                style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}
              >
                💡 {currentStep.action.hint || '点击高亮区域继续'}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div 
            className="px-5 py-3 flex items-center justify-between border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); skipTutorial() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors"
            >
              <SkipForward size={12} />
              跳过教程
            </button>
            
            <div className="flex items-center gap-2">
              {!isFirstStep() && (
                <button
                  onClick={(e) => { e.stopPropagation(); prevStep() }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
                >
                  <ChevronLeft size={14} />
                  上一步
                </button>
              )}
              
              <button
                onClick={(e) => { 
                  e.stopPropagation()
                  if (isLastStep()) {
                    skipTutorial()
                    // Open settings on last step
                    setTimeout(() => {
                      useStore.getState().setSettingsOpen(true)
                    }, 100)
                  } else {
                    nextStep()
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{ 
                  background: 'var(--accent-primary)', 
                  color: 'var(--accent-foreground)',
                }}
              >
                {isLastStep() ? (
                  <>
                    <Settings size={14} />
                    去配置 AI
                  </>
                ) : (
                  <>
                    下一步
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated particles for center mode */}
      {isCenter && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-blue-400/30"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animation: `float-particle ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Global styles for animations */}
      <style>{`
        @keyframes pulse-border {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
