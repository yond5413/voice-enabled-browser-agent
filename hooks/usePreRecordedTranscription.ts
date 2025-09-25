

'use client'

import { useState, useRef, useCallback } from 'react'

interface UsePreRecordedTranscriptionOptions {
  onTranscription: (transcript: string) => void;
}

export const usePreRecordedTranscription = ({ onTranscription }: UsePreRecordedTranscriptionOptions) => {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data)
      })

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []

        try {
          const response = await fetch('/api/agent/transcribe', {
            method: 'POST',
            body: audioBlob
          })

          if (!response.ok) {
            throw new Error(`Transcription API request failed with status ${response.status}`)
          }

          const result = await response.json()
          onTranscription(result.transcript)
        } catch (error) {
          console.error('Error sending audio for transcription:', error)
        }
      }
    }
  }, [isRecording, onTranscription])

  return {
    isRecording,
    startRecording,
    stopRecording
  }
}
