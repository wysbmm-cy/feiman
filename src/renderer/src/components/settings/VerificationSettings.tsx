import React from 'react'
import { useStore } from '../../store'
import { Slider } from '@radix-ui/react-slider'
import { Info, Shield } from 'lucide-react'

interface VerificationSettingsProps {
  onClose: () => void
}

export function VerificationSettings({ onClose }: VerificationSettingsProps) {
  const { verificationSettings, updateVerificationSettings } = useStore()
  const intensityMap: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
  const verificationIntensity = intensityMap.indexOf(verificationSettings.intensity)

  const intensityLabels = [
    { label: '低', desc: '宽松验证，适合快速复习', color: '#22c55e' },
    { label: '中', desc: '标准验证，适合系统学习', color: '#f59e0b' },
    { label: '高', desc: '严格验证，适合深度理解', color: '#ef4444' }
  ]

  const handleIntensityChange = (value: number[]) => {
    const index = Math.max(0, Math.min(2, value[0] ?? 1))
    updateVerificationSettings({
      intensity: intensityMap[index]
    })
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <Shield size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              验证强度设置
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="sr-only">关闭</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Verification Intensity Slider */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label 
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                验证强度
              </label>
              <span 
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ 
                  background: `${intensityLabels[verificationIntensity].color}20`,
                  color: intensityLabels[verificationIntensity].color
                }}
              >
                {intensityLabels[verificationIntensity].label}
              </span>
            </div>
            
            <Slider
              value={[verificationIntensity]}
              onValueChange={handleIntensityChange}
              max={2}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between mt-2">
              {intensityLabels.map((intensity, idx) => (
                <div 
                  key={idx}
                  className="text-xs text-center max-w-[80px]"
                  style={{ 
                    color: verificationIntensity === idx 
                      ? intensity.color 
                      : 'var(--text-muted)',
                    opacity: verificationIntensity === idx ? 1 : 0.6
                  }}
                >
                  {intensity.desc}
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div 
            className="rounded-lg p-4 flex gap-3"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <Info size={18} style={{ color: 'var(--accent-primary)', marginTop: '2px' }} />
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                验证强度影响
              </p>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• 低强度：AI 更宽容，允许模糊解释</li>
                <li>• 中强度：标准验证，平衡严格与包容</li>
                <li>• 高强度：严格要求边界条件和完整推导</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
