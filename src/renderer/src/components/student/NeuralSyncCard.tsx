import React from 'react'
import { Check, ArrowRight, Zap } from 'lucide-react'

interface NeuralSyncCardProps {
  type: 'note' | 'code'
  title: string
  content: any
  onSync: () => void
}

export function NeuralSyncCard({ type, title, content, onSync }: NeuralSyncCardProps) {
  const isNote = type === 'note'
  
  return (
    <div 
      className="mt-3 overflow-hidden rounded-xl border border-dashed animate-fade-in"
      style={{ 
        borderColor: 'var(--accent-primary)',
        background: 'color-mix(in srgb, var(--accent-primary), transparent 95%)'
      }}
    >
      <div className="px-3 py-1.5 flex items-center justify-between border-b" style={{ borderColor: 'color-mix(in srgb, var(--accent-primary), transparent 80%)' }}>
        <div className="flex items-center gap-2">
          <Zap size={12} style={{ color: 'var(--accent-primary)' }} />
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-70" style={{ color: 'var(--accent-primary)' }}>
            Neural Sync // {isNote ? 'NOTE_UPDATE' : 'CODE_UPDATE'}
          </span>
        </div>
        <div className="text-[10px] scale-90 origin-right font-mono" style={{ color: 'var(--accent-primary)' }}>
          PROTO_SYNC_V1
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs font-bold mb-2 flex items-center gap-2">
          <span>{title}</span>
          <ArrowRight size={12} className="opacity-50" />
        </div>
        
        {isNote ? (
          <div className="space-y-2 opacity-80">
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold mr-1">Cue:</span>
              {content.cornell?.cues}
            </div>
            <div className="text-[11px] leading-relaxed line-clamp-2">
              <span className="font-bold mr-1">Summary:</span>
              {content.cornell?.summary}
            </div>
          </div>
        ) : (
          <div className="bg-black/20 rounded p-2 font-mono text-[10px] opacity-70 line-clamp-3">
            {content.code}
          </div>
        )}
        
        <button
          onClick={onSync}
          className="w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ 
            background: 'var(--accent-primary)',
            color: 'var(--bg-surface)',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--accent-primary), transparent 70%)'
          }}
        >
          <Check size={14} strokeWidth={3} />
          <span className="text-xs font-bold tracking-tight">神经网络同步 (Apply Sync)</span>
        </button>
      </div>
    </div>
  )
}
