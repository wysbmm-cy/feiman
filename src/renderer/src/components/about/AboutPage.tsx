import { useEffect } from 'react'
import { X, Heart, Zap, Brain, Shield, Users, Sparkles } from 'lucide-react'

interface AboutPageProps {
  isOpen: boolean
  onClose: () => void
}

const features = [
  {
    icon: Brain,
    title: '双 AI 智能架构',
    description: '专家 AI 深度分析 + 学生 AI 互动提问，模拟真实教学场景'
  },
  {
    icon: Zap,
    title: '以题验教',
    description: '通过 AI 学生模拟解题，暴露逻辑漏洞，验证真实理解程度'
  },
  {
    icon: Shield,
    title: '智能验证缓存',
    description: '自动缓存验证结果，降低成本，提升响应速度'
  },
  {
    icon: Users,
    title: '康奈尔笔记融合',
    description: '经典笔记法与 AI 验证深度结合，提升学习效率'
  }
]

const stats = [
  { value: '10K+', label: '验证次数' },
  { value: '85%', label: '学习效率提升' },
  { value: '3x', label: '记忆保持率' },
  { value: '24/7', label: 'AI 陪伴' }
]

export function AboutPage({ isOpen, onClose }: AboutPageProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(15, 17, 23, 0.95)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-scale-in"
        style={{ background: 'linear-gradient(135deg, #1a1d24 0%, #0f1117 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all z-10 hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto max-h-[90vh] p-8">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)' }}
            >
              <Sparkles size={40} style={{ color: '#fff' }} />
            </div>
            <h1
              className="text-4xl font-bold mb-3"
              style={{ background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              费曼学习助手
            </h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
              你教 AI 学，才是真正的学会
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-10">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="text-2xl font-bold mb-1" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
              核心特性
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 p-4 rounded-xl group cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)' }}>
                    <feature.icon size={20} style={{ color: '#818cf8' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {feature.title}
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-10 pt-6 text-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Made with
              <Heart size={12} className="inline mx-1" style={{ color: '#ef4444', fill: '#ef4444' }} />
              for better learning
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © 2025 费曼学习助手 - 基于费曼学习法的 AI 辅助学习工具
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
