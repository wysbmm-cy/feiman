import React, { useEffect, useMemo, useState } from 'react'
import { MarkdownEditor } from './MarkdownEditor'
import { MarkdownPreview } from './MarkdownPreview'
import { useStore } from '../../store'
import { NodeIndicator } from '../nodes/NodeItem'
import { Columns2, Edit3, Eye, Maximize2, Minimize2 } from 'lucide-react'

interface CornellLayoutProps {
  cues: string
  notes: string
  summary: string
  onCuesChange: (v: string) => void
  onNotesChange: (v: string) => void
  onSummaryChange: (v: string) => void
}

type SectionKey = 'cues' | 'notes' | 'summary'
type SectionMode = 'edit' | 'split' | 'preview'
type FocusSection = 'all' | SectionKey

interface SectionConfig {
  key: SectionKey
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function SectionHeader({
  label,
  mode,
  focused,
  onModeChange,
  onFocusToggle
}: {
  label: string
  mode: SectionMode
  focused: boolean
  onModeChange: (mode: SectionMode) => void
  onFocusToggle: () => void
}) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-widest uppercase flex-shrink-0 border-b"
      style={{
        color: 'var(--text-muted)',
        borderColor: 'rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center">
        <div
          className="w-1.5 h-3.5 mr-2 rounded-full"
          style={{ background: 'var(--primary-color)' }}
        />
        {label}
      </div>

      <div className="flex items-center gap-1">
        <button
          className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150"
          style={{
            color: mode === 'edit' ? 'white' : 'var(--text-muted)',
            background: mode === 'edit' ? 'var(--primary-color)' : 'transparent'
          }}
          onClick={() => onModeChange('edit')}
          title="Edit"
        >
          <Edit3 size={11} />
        </button>
        <button
          className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150"
          style={{
            color: mode === 'split' ? 'white' : 'var(--text-muted)',
            background: mode === 'split' ? 'var(--primary-color)' : 'transparent'
          }}
          onClick={() => onModeChange('split')}
          title="Split"
        >
          <Columns2 size={11} />
        </button>
        <button
          className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150"
          style={{
            color: mode === 'preview' ? 'white' : 'var(--text-muted)',
            background: mode === 'preview' ? 'var(--primary-color)' : 'transparent'
          }}
          onClick={() => onModeChange('preview')}
          title="Preview"
        >
          <Eye size={11} />
        </button>
        <button
          className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150"
          style={{ color: focused ? 'var(--primary-color)' : 'var(--text-muted)' }}
          onClick={onFocusToggle}
          title={focused ? 'Exit Focus' : 'Focus Section'}
        >
          {focused ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
        </button>
      </div>
    </div>
  )
}

function SectionBody({
  mode,
  value,
  onChange,
  placeholder
}: {
  mode: SectionMode
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  if (mode === 'preview') {
    return <MarkdownPreview content={value} className="h-full" />
  }

  if (mode === 'split') {
    return (
      <div className="flex h-full">
        <div className="flex-1 overflow-hidden border-r" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <MarkdownEditor value={value} onChange={onChange} placeholder={placeholder} />
        </div>
        <div className="flex-1 overflow-hidden">
          <MarkdownPreview content={value} className="h-full" />
        </div>
      </div>
    )
  }

  return <MarkdownEditor value={value} onChange={onChange} placeholder={placeholder} />
}

export function CornellLayout({ cues, notes, summary, onCuesChange, onNotesChange, onSummaryChange }: CornellLayoutProps) {
  const { settings, activeNodes } = useStore()
  const { editorViewMode, cornellCuesWidth } = settings.appearance
  const [focusSection, setFocusSection] = useState<FocusSection>('all')
  const [sectionModes, setSectionModes] = useState<Record<SectionKey, SectionMode>>({
    cues: editorViewMode,
    notes: editorViewMode,
    summary: editorViewMode
  })

  useEffect(() => {
    setSectionModes({
      cues: editorViewMode,
      notes: editorViewMode,
      summary: editorViewMode
    })
  }, [editorViewMode])

  const sectionConfigs = useMemo<SectionConfig[]>(() => ([
    {
      key: 'cues',
      label: 'Cues · Questions',
      value: cues,
      onChange: onCuesChange,
      placeholder: '- Key questions\n- Keywords\n- Retrieval cues'
    },
    {
      key: 'notes',
      label: 'Notes',
      value: notes,
      onChange: onNotesChange,
      placeholder: 'Write your explanation and derivations here...'
    },
    {
      key: 'summary',
      label: 'Summary',
      value: summary,
      onChange: onSummaryChange,
      placeholder: 'Summarize the core logic in 2-4 lines...'
    }
  ]), [cues, notes, summary, onCuesChange, onNotesChange, onSummaryChange])

  const cuesWidth = `${cornellCuesWidth}%`

  const renderSectionPanel = (section: SectionConfig, className?: string) => {
    const mode = sectionModes[section.key]
    const focused = focusSection === section.key
    return (
      <div
        key={section.key}
        className={`flex flex-col overflow-hidden rounded-xl glass-panel-strong shadow-md transition-all duration-200 ${className || ''}`}
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        <SectionHeader
          label={section.label}
          mode={mode}
          focused={focused}
          onModeChange={(nextMode) => {
            setSectionModes((prev) => ({ ...prev, [section.key]: nextMode }))
          }}
          onFocusToggle={() => {
            setFocusSection((prev) => (prev === section.key ? 'all' : section.key))
          }}
        />

        {section.key === 'cues' && activeNodes.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5 px-3 py-2 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
          >
            {activeNodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                title={node.label}
              >
                <NodeIndicator state={node.state} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {node.label.length > 9 ? `${node.label.slice(0, 9)}...` : node.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-hidden bg-transparent">
          <SectionBody
            mode={mode}
            value={section.value}
            onChange={section.onChange}
            placeholder={section.placeholder}
          />
        </div>
      </div>
    )
  }

  if (focusSection !== 'all') {
    const focusedSection = sectionConfigs.find((section) => section.key === focusSection)
    if (!focusedSection) return null

    return (
      <div className="h-full p-2" style={{ background: 'var(--bg-base)' }}>
        {renderSectionPanel(focusedSection, 'h-full')}
      </div>
    )
  }

  const cuesSection = sectionConfigs.find((section) => section.key === 'cues')!
  const notesSection = sectionConfigs.find((section) => section.key === 'notes')!
  const summarySection = sectionConfigs.find((section) => section.key === 'summary')!

  return (
    <div
      className="h-full p-2 gap-2"
      style={{
        background: 'var(--bg-base)',
        display: 'grid',
        gridTemplateColumns: `${cuesWidth} 1fr`,
        gridTemplateRows: '1fr 220px',
        gridTemplateAreas: '"cues notes" "summary summary"'
      }}
    >
      <div style={{ gridArea: 'cues', minWidth: 0, minHeight: 0 }}>
        {renderSectionPanel(cuesSection, 'h-full')}
      </div>
      <div style={{ gridArea: 'notes', minWidth: 0, minHeight: 0 }}>
        {renderSectionPanel(notesSection, 'h-full')}
      </div>
      <div style={{ gridArea: 'summary', minWidth: 0, minHeight: 0 }}>
        {renderSectionPanel(summarySection, 'h-full')}
      </div>
    </div>
  )
}
