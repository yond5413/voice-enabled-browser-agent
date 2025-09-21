'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export const useDeepgram = (onTranscription: (transcript: string) => void) => {
  const [isRecording, setIsRecording] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')

  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onTranscriptionRef = useRef(onTranscription);

  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
  }, [onTranscription]);

  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  const startRecording = useCallback(async () => {
    if (!deepgramApiKey) {
      console.error("Deepgram API key is not defined. Make sure you have a NEXT_PUBLIC_DEEPGRAM_API_KEY in your .env.local file.")
      return
    }

    try {
      const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-3', [
        'token',
        deepgramApiKey
      ])
      socketRef.current = socket

      socket.onopen = async () => {
        console.log('Deepgram WebSocket connected.');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        });

        mediaRecorder.start(250);
        setIsRecording(true);
        setInterimTranscript('');
        setFinalTranscript('');
      }

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel.alternatives[0]?.transcript;
        
        if (transcript) {
          if (received.is_final) {
            setFinalTranscript(prev => {
              const newFinal = (prev ? prev + ' ' : '') + transcript;
              onTranscriptionRef.current(newFinal);
              return newFinal;
            });
            setInterimTranscript('');
          } else {
            setInterimTranscript(transcript);
          }
        }
      }

      socket.onclose = () => {
        console.log('Deepgram WebSocket closed.');
        setIsRecording(false);
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }

      socket.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        setIsRecording(false);
      }

    } catch (error) {
      console.error('Error starting recording or connecting to Deepgram:', error);
      setIsRecording(false);
    }
  }, [deepgramApiKey]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    }
  }, [stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    interimTranscript,
    finalTranscript,
  }
}
