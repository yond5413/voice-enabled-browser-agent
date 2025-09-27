'use client'

import { useState, useCallback, useEffect } from 'react'
import { Mic, MicOff, Activity, History, Zap } from 'lucide-react'
import { usePreRecordedTranscription } from '@/hooks/usePreRecordedTranscription'
import { ActionLog } from '@/types'
import BrowserView from '@/components/BrowserView'
import { generateId } from '@/utils/utils'
import {
  Panel,  
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels"

export default function Home() {
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [sessionViewUrl, setSessionViewUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null)

  const openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/agent/session');
        if (!response.ok) {
          throw new Error(`Failed to fetch session: ${response.statusText}`);
        }
        const data = await response.json();
        setSessionViewUrl(data.sessionViewUrl);
      } catch (error) {
        console.error(error);
        // Optionally, set an error state to show in the UI
      }
    };

    if (!(window as any).__fetchedSession__) {
      (window as any).__fetchedSession__ = true
      // ensure a persistent session id per tab
      try {
        const existing = window.localStorage.getItem('agentSessionId')
        const id = existing || generateId()
        if (!existing) window.localStorage.setItem('agentSessionId', id)
        setSessionId(id)
      } catch {
        // fallback if localStorage unavailable
        const id = generateId()
        setSessionId(id)
      }
      fetchSession()
    }
  }, []);

  const handleTranscription = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    const logId = addActionLog({ command: transcript, status: 'processing', result: 'Parsing intent...' });
    setIsProcessing(true);
    setClarificationQuestion('');

    try {
      if (!openRouterApiKey) {
        throw new Error('OpenRouter API key not configured. Please add NEXT_PUBLIC_OPENROUTER_API_KEY to your .env.local file.');
      }

      if (!sessionId) {
        throw new Error('Session not ready. Please try again in a moment.')
      }

      const res = await fetch('/api/agent/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, transcript, openRouterApiKey })
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || `Converse API error: ${res.status}`)
      }

      const data = await res.json()
      if (data.type === 'clarify') {
        updateActionLog(logId, { status: 'success', result: 'Awaiting clarification from user.' })
        setClarificationQuestion(data.question || 'Could you be more specific?')
      } else {
        updateActionLog(logId, { status: 'success', result: data.result || 'Action executed.' })
      }
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
  }, [openRouterApiKey, sessionId]);

  const { 
    isRecording,
    startRecording,
    stopRecording,
  } = usePreRecordedTranscription({ onTranscription: handleTranscription });

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
      setClarificationQuestion('');
      startRecording();
    }
  };

  const clearLogs = () => {
    setActionLogs([]);
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
    <div className="h-screen bg-gray-100 p-4">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={60} minSize={20}>
          <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
            <BrowserView viewUrl={sessionViewUrl} />
          </div>
        </Panel>
        <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-primary/50 transition-colors rounded-md mx-1" />
        <Panel defaultSize={40} minSize={20}>
          <div className="flex flex-col h-full space-y-4 overflow-y-auto custom-scrollbar p-2">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Mic className="h-6 w-6 text-primary mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">Project Aria</h1>
              </div>
              <p className="text-sm text-gray-600">
                Voice-controlled browser agent.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="text-center">
                <button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`relative w-20 h-20 rounded-full font-bold text-white shadow-md transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none ${isRecording ? 'bg-red-500 hover:bg-red-600 recording-pulse' : 'bg-primary hover:bg-primary/90'}`}>
                  {isRecording ? <MicOff className="h-7 w-7 mx-auto" /> : <Mic className="h-7 w-7 mx-auto" />}
                </button>
                <div className="h-12 flex items-center justify-center">
                  {isRecording && <p className="text-red-600 font-medium animate-pulse flex items-center justify-center">🎤 Recording...</p>}
                  {isProcessing && <p className="text-blue-600 font-medium"><Activity className="inline h-4 w-4 animate-spin mr-2" />Processing...</p>}
                  {clarificationQuestion && <p className="text-amber-600 font-medium">{clarificationQuestion}</p>}
                  {!isRecording && !isProcessing && !clarificationQuestion && <p className="text-gray-600">Click to start recording</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex-grow flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <History className="h-5 w-5 text-gray-600 mr-2" />
                    <h2 className="text-lg font-bold text-gray-900">Action History</h2>
                  </div>
                  {actionLogs.length > 0 && <button onClick={clearLogs} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>}
                </div>
              </div>

              <div className="p-4 space-y-3 flex-grow overflow-y-auto custom-scrollbar">
                {actionLogs.length === 0 ? (
                  <div className="text-center py-10">
                    <Mic className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No commands yet</p>
                  </div>
                ) : (
                  actionLogs.map((log) => (
                    <div key={log.id} className={`p-3 rounded-lg border transition-all ${getStatusColor(log.status)}`}>
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
        </Panel>
      </PanelGroup>
    </div>
  )
}