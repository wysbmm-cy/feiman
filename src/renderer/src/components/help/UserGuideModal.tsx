import React, { useEffect, useState } from 'react'
import { BookOpen, HelpCircle, X, ChevronRight, Zap, MessageSquare, GitBranch, Target, Lightbulb, Users } from 'lucide-react'

interface GuideSection {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

interface UserGuideModalProps {
  open: boolean
  onClose: () => void
}

export function UserGuideModal({ open, onClose }: UserGuideModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    setIsMounted(true)
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!open || !isMounted) return null

  const sections: GuideSection[] = [
    {
      id: 'overview',
      title: '快速入门',
      icon: <Zap size={18} />,
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">🎓 什么是费曼学习法？</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              费曼学习法的核心理念是："如果你不能简单地解释它，你就没有真正理解它"。
              通过向他人（或 AI）解释概念来发现自己的理解盲区，从而实现真正的深层学习。
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">开始使用只需三步：</h4>
            <div className="space-y-2">
              {[
                { step: 1, text: '在设置中配置 AI 模型（推荐使用 OpenAI 或 DeepSeek）' },
                { step: 2, text: '创建笔记本并新建笔记' },
                { step: 3, text: '选择学习主题，开始记录和学习' }
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                    {step}
                  </span>
                  <span className="text-sm text-gray-300">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'workflow',
      title: '学习工作流',
      icon: <GitBranch size={18} />,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 mb-3">费曼学习法包含六个阶段，系统会自动引导你完成：</p>
          
          {[
            { 
              phase: '学习阶段', 
              color: 'var(--phase-study)', 
              desc: '使用康奈尔笔记格式记录知识要点',
              tips: '在笔记栏记录核心概念，线索栏写关键词'
            },
            { 
              phase: '解释阶段', 
              color: 'var(--phase-explain)', 
              desc: '用自己的语言解释概念',
              tips: '假设你在教一个初学者，用最简单的语言解释'
            },
            { 
              phase: '苏格拉底阶段', 
              color: 'var(--phase-socratic)', 
              desc: 'AI 会提出启发式问题引导思考',
              tips: '深入思考每个问题，发现理解盲区'
            },
            { 
              phase: '评估阶段', 
              color: 'var(--phase-evaluate)', 
              desc: '专家 AI 评估你的理解深度',
              tips: '查看详细的评估报告和改进建议'
            },
            { 
              phase: '精炼阶段', 
              color: 'var(--phase-refine)', 
              desc: '根据反馈改进你的解释',
              tips: '针对薄弱环节进行针对性学习'
            },
            { 
              phase: '验证阶段', 
              color: 'var(--phase-verify)', 
              desc: '通过应用场景验证掌握程度',
              tips: '完成实际应用场景的挑战任务'
            }
          ].map(({ phase, color, desc, tips }) => (
            <div key={phase} className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <h4 className="text-sm font-semibold text-gray-200">{phase}</h4>
              </div>
              <p className="text-xs text-gray-400 mb-1">{desc}</p>
              <p className="text-xs text-gray-500 italic">💡 {tips}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'features',
      title: '核心功能',
      icon: <Target size={18} />,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <BookOpen size={16} />,
              title: '康奈尔笔记',
              desc: '三区域笔记格式：笔记栏、线索栏、总结栏，结构化记录知识',
              color: 'text-blue-400'
            },
            {
              icon: <MessageSquare size={16} />,
              title: 'AI 学生对话',
              desc: 'AI 扮演学生，向你提问，帮助你发现自己理解不够深入的地方',
              color: 'text-green-400'
            },
            {
              icon: <Users size={16} />,
              title: '双 AI 模式',
              desc: '学生 AI 负责提问，专家 AI 负责评估，全方位辅助学习',
              color: 'text-purple-400'
            },
            {
              icon: <GitBranch size={16} />,
              title: '知识图谱',
              desc: '自动关联知识点，可视化知识结构，发现概念间的联系',
              color: 'text-orange-400'
            }
          ].map(({ icon, title, desc, color }) => (
            <div key={title} className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div className={`mb-2 ${color}`}>{icon}</div>
              <h4 className="text-sm font-semibold text-gray-200 mb-1">{title}</h4>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'code-mode',
      title: '编程学习模式',
      icon: <Lightbulb size={18} />,
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <h4 className="text-sm font-semibold text-cyan-300 mb-2">💻 什么是编程学习模式？</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              针对编程语言学习的特化模式，AI 学生"小方"会扮演一个正在学习编程的学生，
              针对你的讲解提出针对性的问题，帮助你深入理解编程概念和常见陷阱。
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">支持的语言：</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '⚡', name: 'C/C++', desc: '内存管理、指针、模板' },
                { icon: '🐍', name: 'Python', desc: '装饰器、生成器、异步' },
                { icon: '☕', name: 'Java', desc: 'JVM、并发、设计模式' },
                { icon: '🌐', name: 'JavaScript', desc: '闭包、原型链、事件循环' }
              ].map(({ icon, name, desc }) => (
                <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{name}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">编程模式特色：</h4>
            {[
              { title: '常见误解', desc: 'AI 会模拟各语言初学者的常见误解' },
              { title: '概念分级', desc: '从语法记忆到底层原理，6 级理解深度评估' },
              { title: '验证场景', desc: '自动生成代码场景验证你的理解' },
              { title: '学习路径', desc: '基于掌握情况推荐下一步学习内容' }
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-2 p-2 rounded-lg bg-gray-800/30">
                <ChevronRight size={14} className="flex-shrink-0 mt-0.5 text-cyan-400" />
                <div>
                  <span className="text-sm text-gray-200 font-medium">{title}</span>
                  <span className="text-xs text-gray-400 ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-300">
              💡 点击顶部的模式切换按钮，选择编程语言即可进入对应的学习模式
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: '学习技巧',
      icon: <Lightbulb size={18} />,
      content: (
        <div className="space-y-3">
          <div className="space-y-2">
            {[
              {
                title: '从简单开始',
                desc: '选择一个你熟悉的概念先练习，熟悉费曼学习法的流程'
              },
              {
                title: '用自己的语言',
                desc: '不要照搬教材或资料，用你自己的话来解释概念'
              },
              {
                title: '承认不知道',
                desc: '遇到不确定的地方，直接承认，这正是需要深入学习的部分'
              },
              {
                title: '多做类比',
                desc: '用生活中的例子做类比，能帮助你更好地理解抽象概念'
              },
              {
                title: '定期复习',
                desc: '使用总结栏定期回顾，强化记忆和理解'
              },
              {
                title: '善用知识图谱',
                desc: '查看知识点之间的关联，建立完整的知识体系'
              }
            ].map(({ title, desc }) => (
              <div key={title} className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <h4 className="text-sm font-semibold text-gray-200 mb-1">✨ {title}</h4>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-green-300">
              🎯 记住：费曼学习法的核心是"以教促学"，通过解释来验证和加深理解
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-4xl h-[85vh] rounded-2xl border border-gray-700/50 bg-[#161b22] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white border border-blue-500/30">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">用户使用指导</h2>
              <p className="text-xs text-gray-400">快速掌握费曼学习法 AI 助手</p>
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
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-gray-700/50 bg-gray-800/20 flex-shrink-0">
            <div className="p-3 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
                  }`}
                >
                  <span className={activeSection === section.id ? 'text-blue-400' : ''}>
                    {section.icon}
                  </span>
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6">
            {sections.find(s => s.id === activeSection)?.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700/50 bg-gray-800/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              按 <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-700 text-gray-400">Esc</kbd> 关闭
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              开始学习
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserGuideModal
