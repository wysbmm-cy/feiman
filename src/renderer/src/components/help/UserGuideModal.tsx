import React, { useEffect, useState } from 'react'
import { 
  BookOpen, HelpCircle, X, ChevronRight, Zap, MessageSquare, GitBranch, 
  Target, Lightbulb, Users, Settings, Key, Globe, Cpu, AlertCircle,
  CheckCircle, ExternalLink, Copy, Terminal, Play, RefreshCw
} from 'lucide-react'
import { useStore } from '../../store'

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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { resetTutorial, startTutorial } = useStore()

  useEffect(() => {
    setIsMounted(true)
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  const handleRestartTutorial = () => {
    resetTutorial()
    onClose()
    setTimeout(() => {
      startTutorial()
    }, 100)
  }

  if (!open || !isMounted) return null

  // 代码块组件
  const CodeBlock = ({ code, language = 'text', id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <pre className="p-3 rounded-lg bg-gray-900 border border-gray-700 overflow-x-auto text-xs font-mono text-gray-300">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
        title="复制"
      >
        {copiedId === id ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
      </button>
    </div>
  )

  // 信息框组件
  const InfoBox = ({ type, title, children }: { type: 'info' | 'warning' | 'success' | 'tip', title?: string, children: React.ReactNode }) => {
    const styles = {
      info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-300', icon: '💡' },
      warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-300', icon: '⚠️' },
      success: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-300', icon: '✅' },
      tip: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-300', icon: '🎯' }
    }
    const style = styles[type]
    
    return (
      <div className={`p-4 rounded-xl ${style.bg} border ${style.border}`}>
        {title && <h4 className={`text-sm font-semibold ${style.text} mb-2`}>{style.icon} {title}</h4>}
        <div className="text-xs text-gray-400 leading-relaxed">{children}</div>
      </div>
    )
  }

  // 表格组件
  const Table = ({ headers, rows }: { headers: string[], rows: string[][] }) => (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-xs">
        <thead className="bg-gray-800/50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-gray-300 font-medium border-b border-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-700/50 last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const sections: GuideSection[] = [
    // ========== 快速入门 ==========
    {
      id: 'overview',
      title: '快速入门',
      icon: <Zap size={18} />,
      content: (
        <div className="space-y-4">
          <InfoBox type="info" title="什么是费曼学习法？">
            费曼学习法的核心理念是：<strong>"如果你不能简单地解释它，你就没有真正理解它"</strong>。
            通过向他人（或 AI）解释概念来发现自己的理解盲区，从而实现真正的深层学习。
          </InfoBox>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">1</span>
              配置 AI 模型
            </h4>
            <p className="text-xs text-gray-400 ml-8">
              首先需要在设置中配置 AI 模型。应用支持多种主流 AI 服务商（OpenAI、DeepSeek、通义千问等）。
              <button onClick={() => setActiveSection('config')} className="text-blue-400 hover:underline ml-1">
                查看详细配置指南 →
              </button>
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center">2</span>
              创建笔记本
            </h4>
            <p className="text-xs text-gray-400 ml-8">
              点击左侧边栏的「+」按钮创建笔记本，用于组织管理你的学习笔记。
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center">3</span>
              开始学习
            </h4>
            <p className="text-xs text-gray-400 ml-8">
              新建笔记，选择学习主题，按照系统引导完成六阶段学习流程。
            </p>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <Play size={14} className="text-blue-400" />
                  交互式新手引导
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  第一次使用？点击右侧按钮开启游戏化的界面引导教程
                </p>
              </div>
              <button
                onClick={handleRestartTutorial}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                开始引导
              </button>
            </div>
          </div>

          <InfoBox type="tip" title="新手建议">
            建议先选择一个你熟悉的概念进行练习，熟悉整个学习流程后再学习新知识。
          </InfoBox>
        </div>
      )
    },

    // ========== AI 模型配置指南 ==========
    {
      id: 'config',
      title: 'AI 模型配置',
      icon: <Settings size={18} />,
      content: (
        <div className="space-y-5">
          {/* 概念解释 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Key size={14} className="text-yellow-400" />
              核心概念解释
            </h4>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <h5 className="text-xs font-semibold text-gray-200 mb-1">🔑 API Key（API 密钥）</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  API Key 是一串字符，相当于你的「通行证」。它用于验证你的身份，让你能够调用 AI 服务。
                  <strong className="text-yellow-300">请妥善保管，不要泄露给他人！</strong>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <h5 className="text-xs font-semibold text-gray-200 mb-1">🌐 Base URL（接口地址）</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Base URL 是 AI 服务的「服务器地址」。不同的 AI 服务商有不同的地址。
                  大多数兼容 OpenAI 接口的服务使用 <code className="px-1 py-0.5 rounded bg-gray-700 text-gray-300">/v1</code> 作为后缀。
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <h5 className="text-xs font-semibold text-gray-200 mb-1">🤖 Model（模型名称）</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  模型是 AI 的「大脑」。不同的模型有不同的特点：
                  <br />• <strong>GPT-4o</strong>：OpenAI 最新模型，推理能力强
                  <br />• <strong>DeepSeek-V3</strong>：国产模型，性价比高
                  <br />• <strong>Qwen-Plus</strong>：阿里通义千问，中文理解好
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <h5 className="text-xs font-semibold text-gray-200 mb-1">🌡️ Temperature（温度参数）</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  控制回复的随机性。0-2 之间，值越低越稳定，值越高越有创意。
                  学习场景建议设置为 <strong>0.7</strong>。
                </p>
              </div>
            </div>
          </div>

          {/* 配置步骤 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Terminal size={14} className="text-green-400" />
              配置步骤
            </h4>
            
            <div className="space-y-3">
              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">打开设置界面</p>
                  <p className="text-xs text-gray-400">点击右上角的 ⚙️ 图标，或使用快捷键 <kbd className="px-1 py-0.5 rounded bg-gray-700 text-gray-300 text-[10px]">Ctrl + ,</kbd></p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">点击「添加模型」按钮</p>
                  <p className="text-xs text-gray-400">选择预设服务商或自定义配置</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">3</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">填写配置信息</p>
                  <p className="text-xs text-gray-400">输入 API Key（必填），其他参数可使用默认值</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">4</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">测试连接</p>
                  <p className="text-xs text-gray-400">点击 📶 图标测试配置是否正确，显示 ✅ 表示成功</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">5</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">设为默认</p>
                  <p className="text-xs text-gray-400">点击「设为专家」将该模型设为默认使用</p>
                </div>
              </div>
            </div>
          </div>

          <InfoBox type="warning" title="安全提醒">
            API Key 是敏感信息，请勿分享给他人或在公开场合泄露。
            本应用所有配置均存储在本地，不会上传到任何服务器。
          </InfoBox>
        </div>
      )
    },

    // ========== 服务商配置示例 ==========
    {
      id: 'providers',
      title: '服务商配置',
      icon: <Globe size={18} />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            以下是常用 AI 服务商的配置信息。点击服务商名称可跳转到官网注册/获取 API Key。
          </p>

          {/* DeepSeek */}
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-gray-700">
              <h4 className="text-sm font-semibold text-gray-200">DeepSeek（深度求索）</h4>
              <p className="text-xs text-gray-400">国产模型，性价比高，推荐国内用户使用</p>
            </div>
            <div className="p-4 space-y-2">
              <Table 
                headers={['参数', '值', '说明']}
                rows={[
                  ['Base URL', 'https://api.deepseek.com/v1', '固定地址'],
                  ['Model', 'deepseek-chat', '通用对话模型'],
                  ['Model', 'deepseek-reasoner', '推理增强模型'],
                ]}
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ExternalLink size={12} />
                <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  https://platform.deepseek.com
                </a>
                <span>— 注册并获取 API Key</span>
              </div>
            </div>
          </div>

          {/* OpenAI */}
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-gray-700">
              <h4 className="text-sm font-semibold text-gray-200">OpenAI</h4>
              <p className="text-xs text-gray-400">GPT 系列模型，业界领先</p>
            </div>
            <div className="p-4 space-y-2">
              <Table 
                headers={['参数', '值', '说明']}
                rows={[
                  ['Base URL', 'https://api.openai.com/v1', '固定地址'],
                  ['Model', 'gpt-4o', '最新旗舰模型'],
                  ['Model', 'gpt-4o-mini', '轻量快速模型'],
                ]}
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ExternalLink size={12} />
                <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  https://platform.openai.com
                </a>
                <span>— 注册并获取 API Key</span>
              </div>
              <InfoBox type="warning">
                国内用户需要网络代理才能访问 OpenAI 服务，建议使用 DeepSeek 或通义千问作为替代。
              </InfoBox>
            </div>
          </div>

          {/* 通义千问 */}
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-gray-700">
              <h4 className="text-sm font-semibold text-gray-200">通义千问（阿里云）</h4>
              <p className="text-xs text-gray-400">国产模型，中文理解能力强</p>
            </div>
            <div className="p-4 space-y-2">
              <Table 
                headers={['参数', '值', '说明']}
                rows={[
                  ['Base URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1', '兼容 OpenAI 接口'],
                  ['Model', 'qwen-plus', '通用对话模型'],
                  ['Model', 'qwen-turbo', '快速响应模型'],
                ]}
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ExternalLink size={12} />
                <a href="https://dashscope.console.aliyun.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  https://dashscope.console.aliyun.com
                </a>
                <span>— 开通服务并获取 API Key</span>
              </div>
            </div>
          </div>

          {/* Kimi */}
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-gray-700">
              <h4 className="text-sm font-semibold text-gray-200">Kimi（月之暗面）</h4>
              <p className="text-xs text-gray-400">超长上下文，适合长文本处理</p>
            </div>
            <div className="p-4 space-y-2">
              <Table 
                headers={['参数', '值', '说明']}
                rows={[
                  ['Base URL', 'https://api.moonshot.cn/v1', '固定地址'],
                  ['Model', 'moonshot-v1-8k', '8K 上下文'],
                  ['Model', 'moonshot-v1-128k', '128K 超长上下文'],
                ]}
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ExternalLink size={12} />
                <a href="https://platform.moonshot.cn" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  https://platform.moonshot.cn
                </a>
                <span>— 注册并获取 API Key</span>
              </div>
            </div>
          </div>

          {/* 智谱 */}
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border-b border-gray-700">
              <h4 className="text-sm font-semibold text-gray-200">智谱 AI（GLM）</h4>
              <p className="text-xs text-gray-400">清华系，国产大模型代表</p>
            </div>
            <div className="p-4 space-y-2">
              <Table 
                headers={['参数', '值', '说明']}
                rows={[
                  ['Base URL', 'https://open.bigmodel.cn/api/paas/v4', '兼容 OpenAI 接口'],
                  ['Model', 'glm-4-flash', '免费额度模型'],
                  ['Model', 'glm-4', '旗舰模型'],
                ]}
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ExternalLink size={12} />
                <a href="https://open.bigmodel.cn" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  https://open.bigmodel.cn
                </a>
                <span>— 注册并获取 API Key</span>
              </div>
            </div>
          </div>

          {/* 本地模型 */}
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-gray-500/10 to-slate-500/10 border-b border-gray-700">
              <h4 className="text-sm font-semibold text-gray-200">本地模型（Ollama）</h4>
              <p className="text-xs text-gray-400">无需联网，完全本地运行</p>
            </div>
            <div className="p-4 space-y-2">
              <Table 
                headers={['参数', '值', '说明']}
                rows={[
                  ['Base URL', 'http://localhost:11434/v1', '本地服务地址'],
                  ['Model', 'llama3', 'Meta Llama 3'],
                  ['Model', 'qwen2', '通义千问本地版'],
                ]}
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ExternalLink size={12} />
                <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  https://ollama.ai
                </a>
                <span>— 下载安装 Ollama</span>
              </div>
              <InfoBox type="tip">
                使用本地模型无需 API Key，但需要一定的硬件配置（建议 16GB+ 内存）。
              </InfoBox>
            </div>
          </div>
        </div>
      )
    },

    // ========== 学习工作流 ==========
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
              tips: '在笔记栏记录核心概念，线索栏写关键词',
              icon: '📖'
            },
            { 
              phase: '解释阶段', 
              color: 'var(--phase-explain)', 
              desc: '用自己的语言解释概念',
              tips: '假设你在教一个初学者，用最简单的语言解释',
              icon: '🗣️'
            },
            { 
              phase: '苏格拉底阶段', 
              color: 'var(--phase-socratic)', 
              desc: 'AI 会提出启发式问题引导思考',
              tips: '深入思考每个问题，发现理解盲区',
              icon: '❓'
            },
            { 
              phase: '评估阶段', 
              color: 'var(--phase-evaluate)', 
              desc: '专家 AI 评估你的理解深度',
              tips: '查看详细的评估报告和改进建议',
              icon: '📊'
            },
            { 
              phase: '精炼阶段', 
              color: 'var(--phase-refine)', 
              desc: '根据反馈改进你的解释',
              tips: '针对薄弱环节进行针对性学习',
              icon: '✨'
            },
            { 
              phase: '验证阶段', 
              color: 'var(--phase-verify)', 
              desc: '通过应用场景验证掌握程度',
              tips: '完成实际应用场景的挑战任务',
              icon: '🎯'
            }
          ].map(({ phase, color, desc, tips, icon }) => (
            <div key={phase} className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{icon}</span>
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

    // ========== 核心功能 ==========
    {
      id: 'features',
      title: '核心功能',
      icon: <Target size={18} />,
      content: (
        <div className="space-y-4">
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

          <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <BookOpen size={14} className="text-blue-400" />
              康奈尔笔记格式
            </h4>
            <div className="space-y-2 text-xs text-gray-400">
              <p>
                <strong className="text-gray-200">笔记栏（右下）</strong>：
                记录课堂或阅读的主要内容，使用简洁的句子和列表。
              </p>
              <p>
                <strong className="text-gray-200">线索栏（左侧）</strong>：
                提炼关键词、核心概念和问题，用于复习时回忆内容。
              </p>
              <p>
                <strong className="text-gray-200">总结栏（底部）</strong>：
                用 2-3 句话概括笔记的核心要点，检验自己的理解。
              </p>
            </div>
          </div>
        </div>
      )
    },

    // ========== 编程学习模式 ==========
    {
      id: 'code-mode',
      title: '编程学习模式',
      icon: <Cpu size={18} />,
      content: (
        <div className="space-y-4">
          <InfoBox type="info" title="什么是编程学习模式？">
            针对编程语言学习的特化模式，AI 学生"小方"会扮演一个正在学习编程的学生，
            针对你的讲解提出针对性的问题，帮助你深入理解编程概念和常见陷阱。
          </InfoBox>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">支持的语言：</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '⚡', name: 'C/C++', desc: '内存管理、指针、模板', color: 'from-blue-500 to-cyan-500' },
                { icon: '🐍', name: 'Python', desc: '装饰器、生成器、异步', color: 'from-green-500 to-emerald-500' },
                { icon: '☕', name: 'Java', desc: 'JVM、并发、设计模式', color: 'from-orange-500 to-red-500' },
                { icon: '🌐', name: 'JavaScript', desc: '闭包、原型链、事件循环', color: 'from-yellow-500 to-amber-500' }
              ].map(({ icon, name, desc, color }) => (
                <div key={name} className={`flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r ${color}/10 border border-gray-700/30`}>
                  <span className="text-xl">{icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{name}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">编程模式特色：</h4>
            {[
              { title: '常见误解', desc: 'AI 会模拟各语言初学者的常见误解，帮助你发现知识盲区' },
              { title: '概念分级', desc: '从语法记忆到底层原理，6 级理解深度评估' },
              { title: '验证场景', desc: '自动生成代码场景验证你的理解' },
              { title: '学习路径', desc: '基于掌握情况推荐下一步学习内容' }
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-2 p-2 rounded-lg bg-gray-800/30 mb-2">
                <ChevronRight size={14} className="flex-shrink-0 mt-0.5 text-cyan-400" />
                <div>
                  <span className="text-sm text-gray-200 font-medium">{title}</span>
                  <span className="text-xs text-gray-400 ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <InfoBox type="tip">
            点击顶部的「通用模式」按钮，选择编程语言即可进入对应的学习模式。
          </InfoBox>
        </div>
      )
    },

    // ========== 知识库配置 ==========
    {
      id: 'knowledge-base',
      title: '知识库配置',
      icon: <BookOpen size={18} />,
      content: (
        <div className="space-y-4">
          <InfoBox type="info" title="什么是知识库？">
            知识库功能允许你上传 PDF、TXT、Markdown 等文档，AI 会自动学习其中的内容。
            在对话时，AI 会检索相关知识片段，提供更准确、更有针对性的回答。
          </InfoBox>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-yellow-400" />
              重要：Embedding API 要求
            </h4>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                知识库功能需要 <strong className="text-yellow-300">Embedding API</strong> 支持。
                Embedding 是将文本转换为向量表示的技术，用于语义搜索。
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                不是所有 AI 提供商都支持 Embedding API。如果你的主模型不支持 Embedding，
                需要单独配置一个支持的提供商。
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">哪些提供商支持 Embedding？</h4>
            <div className="space-y-2">
              {[
                { name: 'OpenAI', model: 'text-embedding-3-small', status: '✅ 完全支持', color: 'green' },
                { name: 'DeepSeek', model: 'text-embedding-3-small', status: '✅ 兼容 OpenAI', color: 'green' },
                { name: 'Kimi (月之暗面)', model: 'text-embedding-3-small', status: '✅ 兼容 OpenAI', color: 'green' },
                { name: '通义千问', model: 'text-embedding-v3', status: '✅ 支持', color: 'green' },
                { name: '智谱 GLM', model: 'embedding-3', status: '✅ 支持', color: 'green' },
                { name: '部分国产模型', model: '-', status: '⚠️ 可能不支持', color: 'yellow' },
              ].map(({ name, model, status, color }) => (
                <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                  <div>
                    <span className="text-sm text-gray-200">{name}</span>
                    <span className="text-xs text-gray-500 ml-2">({model})</span>
                  </div>
                  <span className={`text-xs ${color === 'green' ? 'text-green-400' : 'text-yellow-400'}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">如何配置 Embedding 提供商？</h4>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">打开设置 → AI 模型</p>
                  <p className="text-xs text-gray-400">点击右上角齿轮图标进入设置</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">添加支持 Embedding 的提供商</p>
                  <p className="text-xs text-gray-400">推荐添加 OpenAI 或 DeepSeek</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center">3</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">在「角色分配」中选择 Embedding 提供商</p>
                  <p className="text-xs text-gray-400">找到「知识库 Embedding 模型」选项，选择刚才添加的提供商</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center">4</span>
                <div>
                  <p className="text-sm text-gray-200 font-medium">上传文档测试</p>
                  <p className="text-xs text-gray-400">在知识库面板上传 PDF/TXT/MD 文件验证配置</p>
                </div>
              </div>
            </div>
          </div>

          <InfoBox type="tip" title="配置技巧">
            <p>如果你的主模型（如某些国产大模型）不支持 Embedding，可以：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>单独注册一个 DeepSeek 账号（免费额度足够日常使用）</li>
              <li>将 DeepSeek 配置为 Embedding 提供商</li>
              <li>主模型继续使用你喜欢的服务商</li>
            </ul>
          </InfoBox>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">上传文件后报错怎么办？</h4>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-gray-300 mb-2">常见错误及解决方案：</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• <strong className="text-red-300">模型不支持</strong>：更换支持 Embedding 的提供商</li>
                <li>• <strong className="text-red-300">API Key 无效</strong>：检查 Key 是否正确，账户是否有余额</li>
                <li>• <strong className="text-red-300">频率限制</strong>：稍后重试，或升级 API 计划</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },

    // ========== 常见问题 ==========
    {
      id: 'faq',
      title: '常见问题',
      icon: <AlertCircle size={18} />,
      content: (
        <div className="space-y-3">
          {[
            {
              q: 'API Key 填写后仍然报错？',
              a: '请检查：(1) API Key 是否正确复制，前后没有多余空格；(2) 账户是否有余额；(3) Base URL 是否正确；(4) 如果是国内服务商，确保网络能正常访问。'
            },
            {
              q: '为什么 AI 不回复或回复很慢？',
              a: '可能原因：(1) 网络延迟，特别是使用国外服务商；(2) 模型负载高，稍后重试；(3) 请求内容过长，尝试缩短输入。'
            },
            {
              q: '如何选择合适的模型？',
              a: '建议：(1) 日常学习用 DeepSeek 或通义千问，性价比高；(2) 需要强推理能力时用 GPT-4o；(3) 注重隐私或无网络时用本地模型 Ollama。'
            },
            {
              q: '数据会同步到云端吗？',
              a: '不会。所有笔记和设置都存储在本地，只有与 AI 对话时才会向配置的服务商发送请求。我们不会收集任何用户数据。'
            },
            {
              q: '如何备份我的笔记？',
              a: '笔记存储在设置的「笔记本存储路径」目录下，每个笔记本是一个文件夹，笔记为 Markdown 文件。可以直接复制文件夹进行备份。'
            },
            {
              q: '双 AI 模式是什么？',
              a: '双 AI 模式使用两个不同的 AI 角色：学生 AI 扮演学习者向你提问，专家 AI 评估你的解释质量。可以分别配置不同的模型，例如学生用快速模型，专家用强推理模型。'
            },
            {
              q: '快捷键有哪些？',
              a: '常用快捷键：Ctrl+S 保存笔记、Ctrl+\ 切换学生面板、Ctrl+M 公式模式、Ctrl+Shift+H 帮助、Ctrl+Shift+V 语音输入。'
            },
            {
              q: '知识库上传文件报错"模型不支持"？',
              a: '这是因为当前 AI 提供商不支持 Embedding API。请在设置中配置一个支持 Embedding 的提供商（如 DeepSeek、OpenAI），然后在「角色分配」中将其设为 Embedding 提供商。'
            },
            {
              q: '知识库支持哪些文件格式？',
              a: '目前支持 PDF、TXT、Markdown（.md）格式。Word 和 PPT 格式需要先转换为 PDF 或 TXT 再上传。'
            }
          ].map(({ q, a }, i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
              <h4 className="text-sm font-semibold text-gray-200 mb-1">Q: {q}</h4>
              <p className="text-xs text-gray-400">A: {a}</p>
            </div>
          ))}
        </div>
      )
    },

    // ========== 学习技巧 ==========
    {
      id: 'tips',
      title: '学习技巧',
      icon: <Lightbulb size={18} />,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: '从简单开始', desc: '选择一个你熟悉的概念先练习', icon: '🌱' },
              { title: '用自己的语言', desc: '不要照搬教材，用自己的话解释', icon: '🗣️' },
              { title: '承认不知道', desc: '不确定的地方正是需要深入学习的', icon: '🎯' },
              { title: '多做类比', desc: '用生活中的例子帮助理解抽象概念', icon: '💡' },
              { title: '定期复习', desc: '使用总结栏回顾，强化记忆', icon: '📅' },
              { title: '善用知识图谱', desc: '查看知识点关联，建立完整体系', icon: '🗺️' }
            ].map(({ title, desc, icon }) => (
              <div key={title} className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <span>{icon}</span>
                  <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
                </div>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>

          <InfoBox type="success" title="费曼学习法的核心">
            "以教促学" —— 通过解释来验证和加深理解。当你能把一个概念清楚地解释给别人听时，
            才说明你真正理解了它。
          </InfoBox>

          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <h4 className="text-sm font-semibold text-gray-200 mb-2">🎯 学习效果自检清单</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>□ 我能用一句话概括这个概念吗？</li>
              <li>□ 我能举出一个生活中的类比吗？</li>
              <li>□ 我能解释这个概念为什么重要吗？</li>
              <li>□ 我能说出这个概念与其他概念的联系吗？</li>
              <li>□ 我能应用这个概念解决实际问题吗？</li>
            </ul>
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
          <div className="w-52 border-r border-gray-700/50 bg-gray-800/20 flex-shrink-0 overflow-y-auto">
            <div className="p-2 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200 text-xs ${
                    activeSection === section.id
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
                  }`}
                >
                  <span className={activeSection === section.id ? 'text-blue-400' : ''}>
                    {section.icon}
                  </span>
                  <span className="font-medium">{section.title}</span>
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
            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-500">
                按 <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-700 text-gray-400">Esc</kbd> 关闭
              </p>
              <button
                onClick={handleRestartTutorial}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={12} />
                重新开始新手引导
              </button>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com/wysbmm-cy/feiman" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
              >
                <ExternalLink size={12} />
                GitHub
              </a>
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
    </div>
  )
}

export default UserGuideModal
