'use client'

import { useState, useCallback, useEffect } from 'react'
import { Mic, MicOff, Activity, History, Zap } from 'lucide-react'
import { useDeepgram } from '@/hooks/useDeepgram'
import { parseIntent } from '@/utils/intentParser'
import { executeBrowserAction } from '@/utils/stagehandActions'
import { ActionLog } from '@/types'

export default function Home() {
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingMode, setRecordingMode] = useState<'push-to-talk' | 'continuous'>('continuous')

  const openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  const handleTranscription = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    const logId = addActionLog({ command: transcript, status: 'processing', result: 'Parsing intent...' });
    setIsProcessing(true);

    try {
      if (!openRouterApiKey) {
        throw new Error('OpenRouter API key not configured. Please add NEXT_PUBLIC_OPENROUTER_API_KEY to your .env.local file.');
      }

      const intent = await parseIntent(transcript, openRouterApiKey);
      updateActionLog(logId, { action: intent, result: 'Executing action...' });

      const result = await executeBrowserAction(intent);
      updateActionLog(logId, { status: 'success', result });
    } catch (error: any) {
      console.error('Error in voice processing pipeline:', error);
      let errorMessage = error.message || 'An unknown error occurred.';
      
      // Provide more user-friendly error messages
      if (error.message?.includes('API key')) {
        errorMessage = 'API configuration error. Please check your environment variables.';
      } else if (error.message?.includes('model')) {
        errorMessage = 'AI model error. Please try again or contact support.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      updateActionLog(logId, { status: 'error', result: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  }, [openRouterApiKey]);

  const { 
    isRecording,
    startRecording,
    stopRecording,
    interimTranscript,
    finalTranscript,
    recordingDuration,
  } = useDeepgram(handleTranscription, {
    maxRecordingDuration: recordingMode === 'push-to-talk' ? 30000 : 120000, // 30s for push-to-talk, 2min for continuous
    autoStopOnSilence: recordingMode === 'push-to-talk', 
    silenceThreshold: recordingMode === 'push-to-talk' ? 2000 : 4000, // Shorter silence for push-to-talk
  });

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

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearLogs = () => {
    setActionLogs([]);
  };

  const formatDuration = (durationMs: number) => {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const maxDuration = recordingMode === 'push-to-talk' ? 30000 : 120000;
    return Math.min((recordingDuration / maxDuration) * 100, 100);
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
            {/* Recording Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setRecordingMode('continuous')}
                    disabled={isRecording}
                    className={`px-4 py-2 text-sm rounded-md transition-all ${
                      recordingMode === 'continuous'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Continuous (2 min)
                  </button>
                  <button
                    onClick={() => setRecordingMode('push-to-talk')}
                    disabled={isRecording}
                    className={`px-4 py-2 text-sm rounded-md transition-all ${
                      recordingMode === 'push-to-talk'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Push-to-Talk (30s)
                  </button>
                </div>
              </div>
              <button
                onClick={toggleRecording}
                disabled={isProcessing}
                className={`relative w-24 h-24 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none ${isRecording ? 'bg-red-500 hover:bg-red-600 recording-pulse' : 'bg-primary hover:bg-primary/90'}`}>
                {isRecording ? <MicOff className="h-8 w-8 mx-auto" /> : <Mic className="h-8 w-8 mx-auto" />}
              </button>
            </div>

            <div className="h-16">
              {isRecording && (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium animate-pulse flex items-center justify-center">
                    🎤 Recording... {formatDuration(recordingDuration)}
                  </p>
                  <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Max {recordingMode === 'push-to-talk' ? '0:30' : '2:00'} {recordingMode === 'push-to-talk' ? 'seconds' : 'minutes'}
                  </p>
                </div>
              )}
              {isProcessing && <p className="text-blue-600 font-medium"><Activity className="inline h-4 w-4 animate-spin mr-2" />Processing your command...</p>}
              {!isRecording && !isProcessing && (
                <div className="space-y-1">
                  <p className="text-gray-600">Click the microphone to start recording</p>
                  <p className="text-xs text-gray-400">
                    {recordingMode === 'continuous' 
                      ? 'Continuous: 2min max • Pause-friendly • Natural speech patterns'
                      : 'Push-to-talk: 30s max • Auto-stops on 2s silence'
                    }
                  </p>
                </div>
              )}
            </div>

            {(finalTranscript || interimTranscript) && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-800 mb-2">Transcript:</p>
                <p className="text-blue-700 text-lg">
                  {finalTranscript}
                  {interimTranscript && <span className="text-gray-500">{interimTranscript}</span>}
                </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              <Zap className="h-4 w-4 mr-2" />Enhanced Speech Recognition
            </h3>
            <ul className="list-disc list-inside text-green-700 text-sm space-y-2">
              <li><strong>🎯 Pause-Friendly:</strong> Natural speech pauses won't stop recording</li>
              <li><strong>⏱️ Extended Duration:</strong> Up to 2 minutes continuous recording</li>
              <li><strong>🔄 Smart Reconnection:</strong> Automatic keep-alive during long pauses</li>
              <li><strong>🎙️ Two Modes:</strong> Continuous & Push-to-Talk options</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Mic className="h-4 w-4 mr-2" />Try these complex commands:
            </h3>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-2">
              <li>"Go to Wikipedia... <em>(pause to think)</em> ...and search for machine learning"</li>
              <li>"Navigate to YouTube, find a tutorial about... <em>(pause)</em> ...React development"</li>
              <li>"Please open Google and... <em>(long pause)</em> ...search for today's weather forecast"</li>
              <li>"I want to go to Amazon... <em>(thinking pause)</em> ...and look for programming books"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}