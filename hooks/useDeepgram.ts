'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseDeepgramOptions {
  maxRecordingDuration?: number // in milliseconds
  autoStopOnSilence?: boolean
  silenceThreshold?: number // in milliseconds
}

export const useDeepgram = (
  onTranscription: (transcript: string) => void, 
  options: UseDeepgramOptions = {}
) => {
  const {
    maxRecordingDuration = 60000, // Default 60 seconds
    autoStopOnSilence = false,
    silenceThreshold = 3000 // 3 seconds of silence
  } = options

  const [isRecording, setIsRecording] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [recordingDuration, setRecordingDuration] = useState(0)

  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onTranscriptionRef = useRef(onTranscription)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const keepAliveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
  }, [onTranscription]);

  const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  const startRecording = useCallback(async () => {
    if (!deepgramApiKey) {
      console.error("Deepgram API key is not defined. Make sure you have a NEXT_PUBLIC_DEEPGRAM_API_KEY in your .env.local file.")
      return
    }

    try {
      // Enhanced WebSocket configuration for handling speech with pauses
      const wsUrl = new URL('wss://api.deepgram.com/v1/listen')
      wsUrl.searchParams.append('model', 'nova-2') // nova-2 is more stable for longer sessions
      wsUrl.searchParams.append('language', 'en-US')
      wsUrl.searchParams.append('smart_format', 'true')
      wsUrl.searchParams.append('endpointing', 'false') // Completely disable automatic endpointing
      wsUrl.searchParams.append('interim_results', 'true')
      // Remove utterance_end_ms to prevent automatic stopping on pauses
      wsUrl.searchParams.append('vad_turnoff', '10000') // Much longer VAD timeout (10 seconds)
      wsUrl.searchParams.append('keepalive', 'true') // Keep connection alive
      wsUrl.searchParams.append('no_delay', 'true') // Send results immediately
      wsUrl.searchParams.append('punctuate', 'true') // Add punctuation for better formatting

      const socket = new WebSocket(wsUrl.toString(), [
        'token',
        deepgramApiKey
      ])
      socketRef.current = socket

      socket.onopen = async () => {
        console.log('Deepgram WebSocket connected.');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
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
        setRecordingDuration(0);
        lastTranscriptTimeRef.current = Date.now();

        // Duration timer - updates every 100ms
        durationTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 100);
        }, 100);

        // Auto-stop timer based on max duration
        recordingTimerRef.current = setTimeout(() => {
          console.log('Auto-stopping recording due to max duration reached');
          stopRecording();
        }, maxRecordingDuration);

        // Keep-alive mechanism - send a keep-alive message every 30 seconds
        const sendKeepAlive = () => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.send(JSON.stringify({ type: 'KeepAlive' }));
              console.log('Sent keep-alive message to maintain connection');
            } catch (error) {
              console.warn('Failed to send keep-alive:', error);
            }
          }
        };

        keepAliveTimerRef.current = setInterval(sendKeepAlive, 30000); // Every 30 seconds

        console.log(`Recording started. Will auto-stop in ${maxRecordingDuration / 1000} seconds`);
      }

      socket.onmessage = (message) => {
        try {
          const received = JSON.parse(message.data);
          
          // Handle both new format (with type) and legacy format (direct channel data)
          if (received.type === 'Results' || received.channel) {
            // This is a transcription result
            const transcript = received.channel?.alternatives?.[0]?.transcript;
            
            if (transcript && transcript.trim()) {
              lastTranscriptTimeRef.current = Date.now();
              
              // Clear existing silence timer since we got speech
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
              }

              if (received.is_final) {
                setFinalTranscript(prev => {
                  const newFinal = (prev ? prev + ' ' : '') + transcript;
                  return newFinal;
                });
                setInterimTranscript('');

                // Only set up silence detection timer if enabled and in push-to-talk mode
                if (autoStopOnSilence) {
                  silenceTimerRef.current = setTimeout(() => {
                    console.log('Auto-stopping recording due to silence detected');
                    stopRecording();
                  }, silenceThreshold);
                }
              } else {
                // Interim result
                setInterimTranscript(transcript);
              }
            }
          } else if (received.type === 'Metadata') {
            // Handle metadata (connection info, etc.)
            console.log('Received metadata:', received);
          } else if (received.type === 'UtteranceEnd') {
            // Handle utterance end - but don't stop recording in continuous mode
            console.log('Utterance end detected, but continuing recording...');
          } else if (!received.type && !received.channel) {
            // Unknown message format
            console.log('Received unknown message format:', received);
          }
        } catch (error) {
          console.error('Error parsing Deepgram message:', error, message.data);
        }
      }

      socket.onclose = () => {
        console.log('Deepgram WebSocket closed.');
        setIsRecording(false);
        setRecordingDuration(0);
        
        // Clean up all timers
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (keepAliveTimerRef.current) {
          clearInterval(keepAliveTimerRef.current);
          keepAliveTimerRef.current = null;
        }

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
  }, [deepgramApiKey, maxRecordingDuration]);

  const stopRecording = useCallback(() => {
    // Clean up all timers first
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Trigger the transcription callback with the full final transcript
    if (finalTranscript.trim()) {
      onTranscriptionRef.current(finalTranscript);
    }
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try { 
        socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      } catch (_) {}
      socketRef.current.close();
    }
  }, [finalTranscript])
  
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
    recordingDuration,
  }
}
