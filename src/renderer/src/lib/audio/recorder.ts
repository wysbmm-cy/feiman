export interface RecorderConfig {
  maxDuration?: number
  sampleRate?: number
}

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioData: Blob | null
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioData: null
  }
  private config: RecorderConfig
  private intervalId: ReturnType<typeof setInterval> | null = null
  private stream: MediaStream | null = null

  constructor(config: RecorderConfig = {}) {
    this.config = {
      maxDuration: 300,
      sampleRate: 16000,
      ...config
    }
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm'

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType
      })

      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })
        this.state.audioData = audioBlob
      }

      this.mediaRecorder.start(1000)
      this.state.isRecording = true
      this.state.isPaused = false
      this.state.duration = 0

      this.intervalId = setInterval(() => {
        this.state.duration++
        if (this.state.duration >= (this.config.maxDuration || 300)) {
          this.stop()
        }
      }, 1000)

    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  pause(): void {
    if (this.mediaRecorder && this.state.isRecording && !this.state.isPaused) {
      this.mediaRecorder.pause()
      this.state.isPaused = true
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.state.isRecording && this.state.isPaused) {
      this.mediaRecorder.resume()
      this.state.isPaused = false
      this.intervalId = setInterval(() => {
        this.state.duration++
        if (this.state.duration >= (this.config.maxDuration || 300)) {
          this.stop()
        }
      }, 1000)
    }
  }

  stop(): Blob | null {
    if (this.mediaRecorder && this.state.isRecording) {
      this.mediaRecorder.stop()
      this.state.isRecording = false
      this.state.isPaused = false

      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop())
        this.stream = null
      }

      return this.state.audioData
    }
    return null
  }

  getState(): RecordingState {
    return { ...this.state }
  }

  getDuration(): number {
    return this.state.duration
  }
}

export default AudioRecorder