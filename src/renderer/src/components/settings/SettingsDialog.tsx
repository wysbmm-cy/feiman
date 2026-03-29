import React, { useState } from 'react'
import { X, Plus, Trash2, CheckCircle, XCircle, Loader2, Wifi } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useStore } from '../../store'
import { useElectron } from '../../hooks/useElectron'
import { testConnection } from '../../lib/ai/client'
import { PROVIDER_PRESETS } from '../../types'
import type { AIProviderConfig } from '../../types'
import type { ColorScheme } from '../../types/settings.types'

const COLOR_SCHEMES: { id: ColorScheme; label: string; color: string; dark?: boolean }[] = [
  { id: 'vampire', label: 'Vampire', color: '#ff5555', dark: true },
  { id: 'abyss', label: 'Abyss', color: '#00b7c0', dark: true },
  { id: 'radiation', label: 'Radiation', color: '#4cd964', dark: true },
  { id: 'sakura', label: '樱花', color: '#ff7096' },
  { id: 'mint', label: '薄荷', color: '#3db8bf' },
  { id: 'sky', label: '天空', color: '#3498db' },
  { id: 'forest', label: '森林', color: '#11aa63' },
  { id: 'mauve', label: '紫藤', color: '#A06EB4' },
  { id: 'golden', label: '金时', color: '#f59e0b' },
  { id: 'cheery', label: '樱桃', color: '#aa1141' },
  { id: 'prussian', label: '普鲁士', color: '#1D4E89' },
]

interface ConnectionStatus { success: boolean; message: string }

export function SettingsDialog() {
  const { 
    settingsOpen, setSettingsOpen, settings, 
    addProvider, updateProvider, removeProvider, 
    setActiveProvider, setExpertProviderId,
    setStudentProviderId, 
    updateAppearance, setSettings 
  } = useStore()
  const api = useElectron()
  const [editingProvider, setEditingProvider] = useState<Partial<AIProviderConfig> | null>(null)
  const [testStatus, setTestStatus] = useState<Record<string, ConnectionStatus | 'testing'>>({})
  const [selectedPreset, setSelectedPreset] = useState(0)

  if (!settingsOpen) return null

  const handleSaveProvider = () => {
    if (!editingProvider?.name || !editingProvider.baseURL || !editingProvider.apiKey || !editingProvider.model) return
    const provider: AIProviderConfig = {
      id: editingProvider.id || uuidv4(),
      name: editingProvider.name,
      baseURL: editingProvider.baseURL,
      apiKey: editingProvider.apiKey,
      model: editingProvider.model,
      maxTokens: editingProvider.maxTokens || 4096,
      temperature: editingProvider.temperature ?? 0.7,
      streamingEnabled: editingProvider.streamingEnabled ?? true,
      isDefault: editingProvider.isDefault ?? false
    }
    if (editingProvider.id) {
      updateProvider(provider)
    } else {
      addProvider(provider)
    }
    setEditingProvider(null)
    // Persist
    if (api) api.setSettings({ aiProviders: [...settings.aiProviders.filter((p) => p.id !== provider.id), provider] })
  }

  const handleTest = async (provider: AIProviderConfig) => {
    setTestStatus((s) => ({ ...s, [provider.id]: 'testing' }))
    const result = await testConnection(provider)
    setTestStatus((s) => ({ ...s, [provider.id]: result }))
  }

  const handleChooseDirectory = async () => {
    if (!api) return
    const res = await api.openDirectoryDialog()
    if (res.success && res.data) {
      updateAppearance({})
      if (api) api.setSettings({ notebooksRootPath: res.data })
      setSettings({ ...settings, notebooksRootPath: res.data })
    }
  }

  const applyPreset = () => {
    const preset = PROVIDER_PRESETS[selectedPreset]
    setEditingProvider((prev) => ({ ...prev, ...preset }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Dialog */}
      <div
        className="relative w-[680px] max-h-[80vh] rounded-xl overflow-hidden flex flex-col animate-fade-in"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>设置</h2>
          <button onClick={() => setSettingsOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Sections */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* AI Providers */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI 模型配置</h3>
                <button
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}
                  onClick={() => setEditingProvider({ maxTokens: 4096, temperature: 0.7, streamingEnabled: true })}
                >
                  <Plus size={11} /> 添加模型
                </button>
              </div>
              {settings.aiProviders.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  暂未配置 AI 模型，点击"添加模型"开始配置。
                </p>
              ) : (
                <div className="space-y-2">
                  {settings.aiProviders.map((p) => {
                    const status = testStatus[p.id]
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                        style={{
                          background: settings.activeProviderId === p.id ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                          borderColor: settings.activeProviderId === p.id ? 'var(--accent-primary)' : 'var(--border-subtle)'
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{p.model} · {p.baseURL}</p>
                        </div>

                        {/* Test status */}
                        {status === 'testing' && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
                        {status && status !== 'testing' && (status as ConnectionStatus).success && <CheckCircle size={14} style={{ color: 'var(--success)' }} />}
                        {status && status !== 'testing' && !(status as ConnectionStatus).success && <XCircle size={14} style={{ color: 'var(--danger)' }} />}

                        <button onClick={() => handleTest(p)} style={{ color: 'var(--text-muted)' }} title="测试连接">
                          <Wifi size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setActiveProvider(p.id)
                            if (api) {
                              api.setSettings({
                                activeProviderId: p.id,
                                aiProviders: settings.aiProviders.map((provider) => ({
                                  ...provider,
                                  isDefault: provider.id === p.id
                                }))
                              })
                            }
                          }}
                          className="text-[11px] px-1.5 py-0.5 rounded"
                          style={{ background: settings.activeProviderId === p.id ? 'var(--accent-primary)' : 'var(--bg-overlay)', color: settings.activeProviderId === p.id ? '#fff' : 'var(--text-muted)' }}
                        >
                          {settings.activeProviderId === p.id ? '默认专家' : '设为专家'}
                        </button>
                        <button onClick={() => setEditingProvider(p)} style={{ color: 'var(--text-muted)' }}>
                          <span className="text-xs">编辑</span>
                        </button>
                        <button
                          onClick={() => {
                            removeProvider(p.id)
                            const nextProviders = settings.aiProviders.filter((provider) => provider.id !== p.id)
                            if (api) {
                              api.setSettings({
                                aiProviders: nextProviders,
                                activeProviderId: settings.activeProviderId === p.id ? '' : settings.activeProviderId,
                                expertProviderId: settings.expertProviderId === p.id ? '' : settings.expertProviderId,
                                studentProviderId: settings.studentProviderId === p.id ? '' : settings.studentProviderId
                              })
                            }
                          }}
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* AI Role Allocation */}
              {settings.aiProviders.length > 0 && (
                <div
                  className="mt-6 p-4 rounded-xl border border-dashed"
                  style={{ background: 'color-mix(in srgb, var(--accent-primary), transparent 95%)', borderColor: 'var(--accent-primary)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <h4 className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>角色分配 (专才管理)</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Expert Role */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>专家 AI 模型 (Expert)</label>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">常规对话 · 逻辑监察</span>
                      </div>
                      <select
                        className="w-full rounded-lg px-2 py-2 text-xs outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500/50"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                        value={settings.expertProviderId || settings.activeProviderId || ''}
                        onChange={(e) => {
                          const id = e.target.value
                          setExpertProviderId(id)
                          if (api) api.setSettings({ expertProviderId: id })
                        }}
                      >
                        <option value="" disabled>-- 请选择专家模型 --</option>
                        {settings.aiProviders.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
                        ))}
                      </select>
                      <p className="mt-1 text-[9px] opacity-50 px-1" style={{ color: 'var(--text-muted)' }}>负责解答用户疑问、分析讲解逻辑以及实时错误纠正</p>
                    </div>

                    {/* Student Role */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>学生 AI 模型 (Student)</label>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">交互式学习 · 提问反馈</span>
                      </div>
                      <select
                        className="w-full rounded-lg px-2 py-2 text-xs outline-none transition-all duration-200 focus:ring-1 focus:ring-orange-500/50"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                        value={settings.studentProviderId || ''}
                        onChange={(e) => {
                          const id = e.target.value
                          setStudentProviderId(id)
                          if (api) api.setSettings({ studentProviderId: id })
                        }}
                      >
                        <option value="" disabled>-- 请选择学生模型 --</option>
                        {settings.aiProviders.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
                        ))}
                      </select>
                      <p className="mt-1 text-[9px] px-1" style={{ color: 'var(--text-muted)' }}>未配置学生模型时，将自动回退使用专家模型。</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Storage */}
            <section>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>存储位置</h3>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  className="flex-1 px-3 py-1.5 rounded text-xs border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  value={settings.notebooksRootPath || '（未设置）'}
                />
                <button
                  className="px-3 py-1.5 rounded text-xs"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                  onClick={handleChooseDirectory}
                >
                  选择目录
                </button>
              </div>
            </section>

            {/* Appearance */}
            <section>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>外观</h3>
              <div className="space-y-3">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>主题</label>
                  <div className="flex gap-1">
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateAppearance({ theme: t })}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          background: settings.appearance.theme === t ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                          color: settings.appearance.theme === t ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        {t === 'dark' ? '深色' : t === 'light' ? '浅色' : '跟随系统'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Scheme */}
                <div>
                  <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>色系</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_SCHEMES
                      .filter(s => {
                        const isDark = settings.appearance.theme === 'dark' || (settings.appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                        return isDark ? s.dark : !s.dark
                      })
                      .map((s) => (
                        <button
                          key={s.id}
                          onClick={() => updateAppearance({ colorScheme: s.id })}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-all duration-200"
                          style={{
                            background: settings.appearance.colorScheme === s.id ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                            border: `1px solid ${settings.appearance.colorScheme === s.id ? s.color : 'var(--border-subtle)'}`,
                            color: settings.appearance.colorScheme === s.id ? s.color : 'var(--text-muted)',
                          }}
                          title={s.label}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: s.color }}
                          />
                          {s.label}
                        </button>
                    ))}
                  </div>
                </div>

                {/* Cornell cues width */}
                <div className="flex items-center justify-between">
                  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>提示列宽度 ({settings.appearance.cornellCuesWidth}%)</label>
                  <input
                    type="range" min={20} max={40} step={5}
                    value={settings.appearance.cornellCuesWidth}
                    onChange={(e) => updateAppearance({ cornellCuesWidth: Number(e.target.value) })}
                    className="w-28"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Provider edit overlay */}
      {editingProvider && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div
            className="w-[480px] rounded-xl p-5 animate-fade-in"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingProvider.id ? '编辑模型配置' : '添加 AI 模型'}
            </h3>

            {/* Preset selector */}
            {!editingProvider.id && (
              <div className="flex gap-2 mb-3">
                <select
                  className="flex-1 px-2 py-1.5 rounded text-xs border"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(Number(e.target.value))}
                >
                  {PROVIDER_PRESETS.map((p, i) => (
                    <option key={i} value={i}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={applyPreset}
                  className="px-3 py-1.5 rounded text-xs"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}
                >
                  应用预设
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {[
                { label: '显示名称', key: 'name', placeholder: 'DeepSeek V3' },
                { label: 'API Base URL', key: 'baseURL', placeholder: 'https://api.deepseek.com/v1' },
                { label: 'API Key', key: 'apiKey', placeholder: 'sk-...' },
                { label: '模型 ID', key: 'model', placeholder: 'deepseek-chat' },
                { label: '最大 Token', key: 'maxTokens', placeholder: '4096', type: 'number' }
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input
                    className="w-full px-3 py-1.5 rounded text-xs border"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    type={type || 'text'}
                    placeholder={placeholder}
                    value={(editingProvider[key as keyof typeof editingProvider] as string) || ''}
                    onChange={(e) => setEditingProvider((prev) => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1.5 rounded text-xs"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setEditingProvider(null)}
              >
                取消
              </button>
              <button
                className="px-4 py-1.5 rounded text-xs font-medium"
                style={{ background: 'var(--accent-primary)', color: '#fff' }}
                onClick={handleSaveProvider}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
