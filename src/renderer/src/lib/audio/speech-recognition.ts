import { getClient } from '../ai/client'
import type { AIProviderConfig } from '../../types'

export interface TranscriptionResult {
  text: string
  confidence?: number
  language?: string
  duration?: number
}

export class SpeechRecognitionService {
  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
  }

  async transcribe(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      const client = getClient(this.config)
      
      const file = new File([audioBlob], 'recording.webm', {
        type: 'audio/webm'
      })

      const transcription = await client.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'zh',
        response_format: 'json'
      })

      return {
        text: transcription.text,
        language: 'zh',
        confidence: 0.95
      }
    } catch (error) {
      console.error('Transcription error:', error)
      throw new Error(`语音识别失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async transcribeWithWebSpeech(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<() => void> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      throw new Error('浏览器不支持语音识别')
    }

    const recognition = new SpeechRecognition()
    
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true)
      }
      if (interimTranscript) {
        onResult(interimTranscript, false)
      }
    }

    recognition.onerror = (event: any) => {
      onError(`语音识别错误: ${event.error}`)
    }

    recognition.start()

    return () => {
      recognition.stop()
    }
  }
}

export function checkWebSpeechSupport(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export default SpeechRecognitionService