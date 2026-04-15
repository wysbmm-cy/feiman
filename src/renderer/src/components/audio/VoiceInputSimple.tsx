import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Pause, Play, Loader2, AlertCircle } from 'lucide-react'
import { AudioRecorder } from '../../lib/audio/recorder'
import { SpeechRecognitionService, checkWebSpeechSupport } from '../../lib/audio/speech-recognition'
import { useStore } from '../../store'

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

interface VoiceInputProps {
  onTranscriptionComplete: (text: string) => void
  compact?: boolean
}

export function VoiceInputSimple({ onTranscriptionComplete, compact = false }: VoiceInputProps) {
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
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
      if (webSpeechStopRef.current) webSpeechStopRef.current()
      if (recorderRef.current) recorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setInterimText('')

      const aiConfig = settings.aiProviders?.find((p) => p.id === settings.activeProviderId && p.apiKey)

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
        const recognition = new SpeechRecognitionService({} as never)
        await recognition.transcribeWithWebSpeech(
          (text, isFinal) => {
            if (isFinal) {
              setInterimText((prev) => `${prev}${text} `)
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
        durationIntervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
      } else {
        setError('Please configure AI provider or use a browser with speech recognition support.')
        setState('idle')
      }
    } catch {
      setError('Cannot access microphone. Check permission settings.')
      setState('idle')
    }
  }, [settings])

  const pauseRecording = useCallback(() => {
    if (!recorderRef.current || state !== 'recording') return
    recorderRef.current.pause()
    setState('paused')
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
  }, [state])

  const resumeRecording = useCallback(() => {
    if (!recorderRef.current || state !== 'paused') return
    recorderRef.current.resume()
    setState('recording')
    durationIntervalRef.current = setInterval(() => {
      if (recorderRef.current) {
        setDuration(recorderRef.current.getDuration())
      }
    }, 1000)
  }, [state])

  const stopRecording = useCallback(async () => {
    setState('processing')
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)

    const aiConfig = settings.aiProviders?.find((p) => p.id === settings.activeProviderId && p.apiKey)

    if (aiConfig && recorderRef.current) {
      const audioBlob = recorderRef.current.stop()
      recorderRef.current = null
      if (!audioBlob) {
        setError('Recording failed, please retry.')
        setState('idle')
        return
      }

      try {
        const recognition = new SpeechRecognitionService(aiConfig as never)
        const result = await recognition.transcribe(audioBlob)
        if (result.text) {
          onTranscriptionComplete(result.text)
        } else {
          setError('No speech recognized.')
        }
      } catch (err) {
        setError(`Transcription failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    } else if (webSpeechStopRef.current) {
      webSpeechStopRef.current()
      webSpeechStopRef.current = null
      if (interimText.trim()) {
        onTranscriptionComplete(interimText.trim())
      } else {
        setError('No speech recognized.')
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

  if (compact) {
    const compactButtonStyle: React.CSSProperties = {
      width: 30,
      height: 30,
      borderRadius: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      color: 'var(--text-muted)',
      cursor: 'pointer'
    }

    if (state === 'processing') {
      return (
        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center border"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      )
    }

    if (state === 'recording' || state === 'paused') {
      return (
        <div className="flex items-center gap-1.5">
          <button
            onClick={state === 'recording' ? pauseRecording : resumeRecording}
            style={{
              ...compactButtonStyle,
              background: state === 'recording'
                ? 'color-mix(in srgb, var(--danger), transparent 82%)'
                : 'color-mix(in srgb, var(--warning), transparent 82%)',
              color: state === 'recording' ? 'var(--danger)' : 'var(--warning)'
            }}
            title={state === 'recording' ? 'Pause recording' : 'Resume recording'}
          >
            {state === 'recording' ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            onClick={stopRecording}
            style={compactButtonStyle}
            title={`Stop and transcribe (${formatDuration(duration)})`}
          >
            <Square size={12} />
          </button>
        </div>
      )
    }

    return (
      <div className="relative">
        <button
          onClick={startRecording}
          style={compactButtonStyle}
          title="Voice input"
        >
          <Mic size={13} />
        </button>
        {error && (
          <div
            className="absolute left-0 bottom-full mb-1 px-2 py-1 rounded text-[10px] whitespace-nowrap flex items-center gap-1 z-20"
            style={{
              background: 'color-mix(in srgb, var(--danger), var(--bg-surface) 20%)',
              color: '#fff'
            }}
          >
            <AlertCircle size={10} />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200 hover:opacity-85"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)'
          }}
          title="Voice input"
        >
          <Mic size={15} />
          <span className="text-xs">Voice</span>
        </button>
        {error && (
          <div
            className="absolute bottom-full left-0 mb-2 px-2 py-1 rounded text-[11px] flex items-center gap-1"
            style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#fff' }}
          >
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  if (state === 'recording' || state === 'paused') {
    return (
      <div
        className="rounded-md px-2 py-1.5 min-w-[180px]"
        style={{
          background: state === 'recording'
            ? 'color-mix(in srgb, var(--danger), transparent 86%)'
            : 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: state === 'recording' ? 'var(--danger)' : 'var(--warning)',
              animation: state === 'recording' ? 'pulse 1.5s infinite' : undefined,
            }}
          />
          <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
            {formatDuration(duration)}
          </span>
          <div className="flex-1" />
          {state === 'recording' ? (
            <button onClick={pauseRecording} className="p-1 rounded" title="Pause">
              <Pause size={13} />
            </button>
          ) : (
            <button onClick={resumeRecording} className="p-1 rounded" title="Resume">
              <Play size={13} />
            </button>
          )}
          <button onClick={stopRecording} className="p-1 rounded" title="Stop and transcribe">
            <Square size={13} />
          </button>
        </div>

        {interimText && (
          <div
            className="text-[11px] px-2 py-1 rounded mt-1"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          >
            {interimText}
          </div>
        )}
      </div>
    )
  }

  if (state === 'processing') {
    return (
      <div
        className="rounded-md px-2 py-1.5 flex items-center gap-2 border"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
      >
        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Transcribing...
        </span>
      </div>
    )
  }

  return null
}
