import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Pause, Play, Loader2, AlertCircle } from 'lucide-react'
import { AudioRecorder } from '../../lib/audio/recorder'
import { SpeechRecognitionService, checkWebSpeechSupport } from '../../lib/audio/speech-recognition'
import { useStore } from '../../store'

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

interface VoiceInputProps {
  onTranscriptionComplete: (text: string) => void
}

export function VoiceInput({ onTranscriptionComplete }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [interimText, setInterimText] = useState('')
  
  const recorderRef = useRef<AudioRecorder | null>(null)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const webSpeechStopRef = useRef<(() => void) | null>(null)
  const { settings } = useStore()

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      if (webSpeechStopRef.current) {
        webSpeechStopRef.current()
      }
      if (recorderRef.current) {
        recorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setInterimText('')
      
      const aiConfig = settings.aiProviders?.find((p) => {
        return p.id === settings.activeProviderId && p.apiKey
      })

      if (aiConfig) {
        recorderRef.current = new AudioRecorder({ maxDuration: 300 })
        await recorderRef.current.start()
        setState('recording')
        
        durationIntervalRef.current = setInterval(() => {
          if (recorderRef.current) {
            setDuration(recorderRef.current.getDuration())
          }
        }, 1000)
      } else if (checkWebSpeechSupport()) {
        const recognition = new SpeechRecognitionService({} as any)
        
        await recognition.transcribeWithWebSpeech(
          (text, isFinal) => {
            if (isFinal) {
              setInterimText(prev => prev + text + ' ')
            } else {
              setInterimText(text)
            }
          },
          (err) => {
            setError(err)
            setState('idle')
          }
        )
        
        webSpeechStopRef.current = () => {
          recognition.transcribeWithWebSpeech(() => {}, () => {})
        }
        
        setState('recording')
        setDuration(0)
        durationIntervalRef.current = setInterval(() => {
          setDuration(d => d + 1)
        }, 1000)
      } else {
        setError('请在设置中配置 AI 或使用支持语音识别的浏览器')
        setState('idle')
      }
      
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置')
      setState('idle')
    }
  }, [settings])

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && state === 'recording') {
      recorderRef.current.pause()
      setState('paused')
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [state])

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && state === 'paused') {
      recorderRef.current.resume()
      setState('recording')
      durationIntervalRef.current = setInterval(() => {
        if (recorderRef.current) {
          setDuration(recorderRef.current.getDuration())
        }
      }, 1000)
    }
  }, [state])

  const stopRecording = useCallback(async () => {
    setState('processing')
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }

    const aiConfig = settings.aiProviders?.find((p) => {
      return p.id === settings.activeProviderId && p.apiKey
    })

    if (aiConfig && recorderRef.current) {
      const audioBlob = recorderRef.current.stop()
      recorderRef.current = null
      
      if (!audioBlob) {
        setError('录音失败，请重试')
        setState('idle')
        return
      }
      
      try {
        const recognition = new SpeechRecognitionService(aiConfig as any)
        const result = await recognition.transcribe(audioBlob)
        
        if (result.text) {
          onTranscriptionComplete(result.text)
        } else {
          setError('未能识别语音内容')
        }
      } catch (err) {
        setError(`识别失败: ${err instanceof Error ? err.message : String(err)}`)
      }
    } else if (webSpeechStopRef.current) {
      webSpeechStopRef.current()
      webSpeechStopRef.current = null
      
      if (interimText.trim()) {
        onTranscriptionComplete(interimText.trim())
      } else {
        setError('未能识别语音内容')
      }
    }

    setState('idle')
    setDuration(0)
    setInterimText('')
  }, [settings, interimText, onTranscriptionComplete])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 空闲状态 - 显示显眼的蓝色按钮
  if (state === 'idle') {
    return (
      <div className="relative">
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all hover:scale-105 font-medium text-sm whitespace-nowrap"
          style={{ 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            border: 'none'
          }}
          title="语音输入 (Ctrl+Shift+V)"
        >
          <Mic size={18} />
          <span>语音输入</span>
        </button>
        {error && (
          <div 
            className="absolute bottom-full left-0 mb-2 p-2 rounded-lg text-xs flex items-center gap-2 whitespace-nowrap"
            style={{ 
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#fff'
            }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  // 录音中状态
  if (state === 'recording' || state === 'paused') {
    return (
      <div 
        className="rounded-lg p-3 min-w-[220px]"
        style={{ 
          background: state === 'recording' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)',
          border: state === 'recording' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${state === 'recording' ? 'animate-pulse bg-red-500' : 'bg-yellow-500'}`} />
          <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
            {formatDuration(duration)}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            / 05:00
          </span>
          
          <div className="flex-1" />
          
          {state === 'recording' ? (
            <button 
              onClick={pauseRecording} 
              className="p-1.5 rounded hover:bg-black/10"
              title="暂停"
            >
              <Pause size={16} />
            </button>
          ) : (
            <button 
              onClick={resumeRecording} 
              className="p-1.5 rounded hover:bg-black/10"
              title="继续"
            >
              <Play size={16} />
            </button>
          )}
          <button 
            onClick={stopRecording} 
            className="p-1.5 rounded hover:bg-black/10"
            title="停止并识别"
          >
            <Square size={16} />
          </button>
        </div>
        
        {interimText && (
          <div 
            className="text-xs p-2 rounded mt-2"
            style={{ 
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)'
            }}
          >
            {interimText}
          </div>
        )}
      </div>
    )
  }

  // 处理中状态
  if (state === 'processing') {
    return (
      <div 
        className="rounded-lg p-3 flex items-center gap-3"
        style={{ 
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          正在识别语音...
        </span>
      </div>
    )
  }

  return null
}
