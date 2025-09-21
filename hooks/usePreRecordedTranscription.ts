
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
        
        const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY
        if (!deepgramApiKey) {
          console.error("Deepgram API key is not defined.")
          return
        }

        try {
          const response = await fetch('https://api.deepgram.com/v1/listen', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${deepgramApiKey}`,
              'Content-Type': 'audio/webm'
            },
            body: audioBlob
          })

          if (!response.ok) {
            throw new Error(`Deepgram API request failed with status ${response.status}`)
          }

          const result = await response.json()
          const transcript = result.results.channels[0].alternatives[0].transcript
          onTranscription(transcript)
        } catch (error) {
          console.error('Error sending audio to Deepgram:', error)
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
