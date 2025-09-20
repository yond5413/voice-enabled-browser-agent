'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Activity, History, Zap } from 'lucide-react'
import { useDeepgram } from '@/hooks/useDeepgram'
import { parseIntent } from '@/utils/intentParser'
import { executeBrowserAction } from '@/utils/stagehandActions'
import { ActionLog, BrowserAction } from '@/types'

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Get API keys from environment variables
  const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  const openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  const { transcribe } = useDeepgram(deepgramApiKey);

  const addActionLog = useCallback((logData: Partial<ActionLog> & { command: string }) => {
    const newLog: ActionLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      status: 'processing',
      ...logData,
    };
    setActionLogs(prev => [newLog, ...prev]);
    return newLog.id;
  }, []);

  const updateActionLog = useCallback((id: string, updates: Partial<ActionLog>) => {
    setActionLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  }, []);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript('');
      setIsProcessing(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const logId = addActionLog({ command: 'Recording finished. Transcribing...' });

        try {
          const transcribedText = await transcribe(audioBlob);
          setTranscript(transcribedText);
          updateActionLog(logId, { command: transcribedText, status: 'processing' });

          if (!transcribedText.trim()) {
            updateActionLog(logId, { status: 'error', result: 'Empty transcript.' });
            setIsProcessing(false);
            return;
          }

          updateActionLog(logId, { result: 'Parsing intent...' });
          const intent = await parseIntent(transcribedText, openRouterApiKey);
          updateActionLog(logId, { action: intent, result: 'Executing action...' });

          const result = await executeBrowserAction(intent);
          updateActionLog(logId, { status: 'success', result });

        } catch (error: any) {
          console.error('Error in voice processing pipeline:', error);
          updateActionLog(logId, { status: 'error', result: error.message || 'An unknown error occurred.' });
        } finally {
          setIsProcessing(false);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') stopRecording();
      }, 5000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      addActionLog({ command: 'Microphone access denied', status: 'error', result: 'Please allow microphone access to use voice commands' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearLogs = () => {
    setActionLogs([]);
    setTranscript('');
  };

  const getStatusColor = (status: ActionLog['status']) => {
    switch (status) {
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: ActionLog['status']) => {
    switch (status) {
      case 'processing': return <Activity className="h-4 w-4 animate-spin" />;
      case 'success': return <Zap className="h-4 w-4" />;
      case 'error': return <MicOff className="h-4 w-4" />;
      default: return <Mic className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full mr-3">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Project Aria</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Voice-controlled browser automation agent. Speak your commands and watch them come to life.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
          <div className="text-center">
            <div className="mb-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`relative w-24 h-24 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none ${isRecording ? 'bg-red-500 hover:bg-red-600 recording-pulse' : 'bg-primary hover:bg-primary/90'}`}>
                {isRecording ? <MicOff className="h-8 w-8 mx-auto" /> : <Mic className="h-8 w-8 mx-auto" />}
              </button>
            </div>

            <div className="h-10">
              {isRecording && <p className="text-red-600 font-medium animate-pulse">🎤 Recording... (Auto-stop in 5s)</p>}
              {isProcessing && <p className="text-blue-600 font-medium"><Activity className="inline h-4 w-4 animate-spin mr-2" />Processing your command...</p>}
              {!isRecording && !isProcessing && <p className="text-gray-600">Click the microphone to start recording</p>}
            </div>

            {transcript && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-800 mb-2">Latest Transcript:</p>
                <p className="text-blue-700 text-lg">"{transcript}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <History className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Action History</h2>
              </div>
              {actionLogs.length > 0 && <button onClick={clearLogs} className="text-sm text-gray-500 hover:text-gray-700">Clear All</button>}
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {actionLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No voice commands yet</p>
                  <p className="text-gray-400 text-sm mt-2">Start recording to see your command history here</p>
                </div>
              ) : (
                actionLogs.map((log) => (
                  <div key={log.id} className={`p-4 rounded-lg border transition-all ${getStatusColor(log.status)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">{log.command}</p>
                            <span className="text-xs opacity-75 ml-2 flex-shrink-0">{log.timestamp}</span>
                          </div>
                          {log.result && <p className="text-xs opacity-80 mt-1">{log.result}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center"><Zap className="h-4 w-4 mr-2" />Try these voice commands:</h3>
          <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
            <li>"Go to wikipedia.org"</li>
            <li>"Click on the English link"</li>
            <li>"Type 'artificial intelligence' in the search box"</li>
            <li>"Click the search button"</li>
            <li>"Extract the main heading"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
