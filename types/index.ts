// Core types for Project Aria

export interface BrowserAction {
  action: 'navigate' | 'click' | 'type' | 'extract'
  target: string
  value?: string
}

export interface ActionLog {
  id: string
  timestamp: string
  command: string
  status: 'processing' | 'success' | 'error'
  result?: string
  action?: BrowserAction
}

export interface VoiceRecordingState {
  isRecording: boolean
  isProcessing: boolean
  transcript: string
  error?: string
}

export interface DeepgramConfig {
  apiKey: string
  model: string
  punctuate: boolean
  diarize: boolean
}

export interface OpenRouterConfig {
  apiKey: string
  model: string
  baseUrl: string
}
