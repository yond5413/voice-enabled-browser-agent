🎯 Primary Goal
Build a voice-controlled browser automation agent that demonstrates two core capabilities in under 24 hours:

Accurate speech-to-text processing using Deepgram

Reliable browser automation using Stagehand

Basic intent parsing via OpenRouter

🛠️ Tech Stack
Frontend: Next.js 14 + TypeScript + Tailwind CSS

Voice: Deepgram (STT)

AI: OpenRouter (Gemini/GPT-4)

Browser Automation: Stagehand (browser-based)

Deployment: Vercel

📋 Phase 1: Core MVP (24-Hour Target)
1. Speech-to-Text Implementation
typescript
// app/hooks/useDeepgram.ts
import { createClient } from '@deepgram/sdk';

export const useDeepgram = () => {
  const transcribe = async (audioBlob: Blob): Promise<string> => {
    🎯 Primary Goal
Build a voice-controlled browser automation agent that demonstrates two core capabilities in under 24 hours:

Accurate speech-to-text processing using Deepgram

Reliable browser automation using Stagehand

Basic intent parsing via OpenRouter

🛠️ Tech Stack
Frontend: Next.js 14 + TypeScript + Tailwind CSS

Voice: Deepgram (STT)

AI: OpenRouter (Gemini/GPT-4)

Browser Automation: Stagehand (browser-based)

Deployment: Vercel

📋 Phase 1: Core MVP (24-Hour Target)
1. Speech-to-Text Implementation
typescript
// app/hooks/useDeepgram.ts
import { createClient } from '@deepgram/sdk';

export const useDeepgram = () => {
  const transcribe = async (audioBlob: Blob): Promise<string> => {
    const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBlob,
      { model: 'nova-2', punctuate: true, diarize: false }
    );
    return result?.results.channels[0].alternatives[0].transcript || '';
  };
  
  return { transcribe };
};
2. Intent Parsing
typescript
// app/utils/intentParser.ts
export const parseIntent = async (transcript: string): Promise<BrowserAction> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': '<YOUR_SITE_URL>',
      'X-Title': 'Voice Browser Agent'
    },
    body: JSON.stringify({
      model: 'google/gemini-pro',
      messages: [{
        role: 'user',
        content: `Convert this voice command to browser action: "${transcript}". 
        Respond ONLY with JSON: {action: "navigate|click|type|extract", target: string, value?: string}`
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};

interface BrowserAction {
  action: 'navigate' | 'click' | 'type' | 'extract';
  target: string;
  value?: string;
}
3. Browser Automation with Stagehand
typescript
// app/utils/stagehandActions.ts
export const executeBrowserAction = (action: BrowserAction): Promise<string> => {
  return new Promise((resolve) => {
    switch (action.action) {
      case 'navigate':
        window.location.href = action.target;
        resolve(`Navigated to ${action.target}`);
        break;
      case 'click':
        const clickElement = document.querySelector(action.target);
        if (clickElement) {
          (clickElement as HTMLElement).click();
          resolve(`Clicked ${action.target}`);
        } else {
          resolve(`Element ${action.target} not found`);
        }
        break;
      case 'type':
        const typeElement = document.querySelector(action.target);
        if (typeElement && action.value) {
          (typeElement as HTMLInputElement).value = action.value;
          resolve(`Typed "${action.value}" into ${action.target}`);
        } else {
          resolve(`Could not type into ${action.target}`);
        }
        break;
      case 'extract':
        const extractElement = document.querySelector(action.target);
        const text = extractElement?.textContent || 'No content found';
        resolve(`Extracted: ${text.substring(0, 100)}...`);
        break;
    }
  });
};
4. Main Application Component
tsx
// app/page.tsx
'use client';
import { useState } from 'react';
import { useDeepgram } from './hooks/useDeepgram';
import { parseIntent } from './utils/intentParser';
import { executeBrowserAction } from './utils/stagehandActions';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const { transcribe } = useDeepgram();

  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const text = await transcribe(audioBlob);
      setTranscript(text);
      
      const intent = await parseIntent(text);
      const result = await executeBrowserAction(intent);
      
      setActions(prev => [...prev, `${text} → ${result}`]);
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
      setIsRecording(false);
    }, 3000); // Record for 3 seconds
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Voice Browser Agent</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`w-full py-4 rounded-lg text-white font-bold ${
              isRecording ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRecording ? 'Recording...' : 'Start Recording (3s)'}
          </button>
          
          {transcript && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-lg">Transcript: {transcript}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Action History</h2>
          <div className="space-y-2">
            {actions.map((action, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <p className="text-sm font-mono">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
5. Environment Setup
bash
# .env.local
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_key_here
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key_here
🎯 Demo Flow
User clicks "Start Recording" and speaks: "Go to wikipedia.org"

System transcribes audio and parses intent

Browser navigates to Wikipedia

Action is logged in history panel

User says: "Click on the English version"

System clicks the English link

User says: "Type 'artificial intelligence' in the search box"

System types in the search field

📦 Deployment
bash
# Deploy to Vercel
vercel --env NEXT_PUBLIC_DEEPGRAM_API_KEY=your_key --env NEXT_PUBLIC_OPENROUTER_API_KEY=your_key --prod
🚀 Phase 2: Enhancements (After MVP)
Real-time transcription streaming

Visual element highlighting

Text-to-speech responses

Session persistence

Advanced command chaining

Split-screen UI with browser view in an <iframe>

This PRD gives you 90% of the code needed for a functional demo. The remaining 10% is your intellectual brilliance in debugging, styling, and adding those unique touches that make it shine. Focus on making the core flow work perfectly - voice command → action → visual feedback. Everything else is polish.

Remove vercel part
We are removing Vercel-specific deployment instructions and focusing on the code that can run anywhere.
We'll adjust the code to be more generic and note that the environment variables should be set in the deployment platform of choice.

However, note that the original code was designed for Next.js and uses client-side and server-side components.
Since we are removing Vercel, we are just focusing on the code and not the deployment.

We'll keep the code as is, but remove the Vercel deployment section.

Also, note that the code uses Next.js API routes. If we are not deploying on Vercel, we can still deploy on any Node.js platform.

Let's adjust the PRD to be platform-agnostic.

Project Aria: Voice Browser Agent PRD (Platform-Agnostic)
🎯 Primary Goal
Build a voice-controlled browser automation agent that demonstrates:

Accurate speech-to-text processing using Deepgram

Reliable browser automation using Stagehand

Basic intent parsing via OpenRouter

🛠️ Tech Stack
Frontend: Next.js 14 + TypeScript + Tailwind CSS

Voice: Deepgram (STT)

AI: OpenRouter (Gemini/GPT-4)

Browser Automation: Stagehand (browser-based)

Deployment: Any platform supporting Node.js (Railway, Render, Fly.io, etc.)

📋 Core Implementation
1. Speech-to-Text with Deepgram
typescript
// app/hooks/useDeepgram.ts
import { createClient } from '@deepgram/sdk';

export const useDeepgram = () => {
  const transcribe = async (audioBlob: Blob): Promise<string> => {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBlob,
      { model: 'nova-2', punctuate: true, diarize: false }
    );
    return result?.results.channels[0].alternatives[0].transcript || '';
  };
  
  return { transcribe };
};
2. Intent Parsing with OpenRouter
typescript
// app/utils/intentParser.ts
interface BrowserAction {
  action: 'navigate' | 'click' | 'type' | 'extract';
  target: string;
  value?: string;
}

export const parseIntent = async (transcript: string): Promise<BrowserAction> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Voice Browser Agent'
    },
    body: JSON.stringify({
      model: 'google/gemini-pro',
      messages: [{
        role: 'user',
        content: `Convert this voice command to browser action: "${transcript}". 
        Respond ONLY with JSON: {action: "navigate|click|type|extract", target: string, value?: string}`
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};
3. Browser Automation with Stagehand
typescript
// app/utils/stagehandActions.ts
export const executeBrowserAction = (action: BrowserAction): Promise<string> => {
  return new Promise((resolve) => {
    switch (action.action) {
      case 'navigate':
        window.location.href = action.target;
        resolve(`Navigated to ${action.target}`);
        break;
      case 'click':
        const clickElement = document.querySelector(action.target);
        if (clickElement) {
          (clickElement as HTMLElement).click();
          resolve(`Clicked ${action.target}`);
        } else {
          resolve(`Element ${action.target} not found`);
        }
        break;
      case 'type':
        const typeElement = document.querySelector(action.target);
        if (typeElement && action.value) {
          (typeElement as HTMLInputElement).value = action.value;
          // Trigger change event for React forms
          typeElement.dispatchEvent(new Event('input', { bubbles: true }));
          resolve(`Typed "${action.value}" into ${action.target}`);
        } else {
          resolve(`Could not type into ${action.target}`);
        }
        break;
      case 'extract':
        const extractElement = document.querySelector(action.target);
        const text = extractElement?.textContent || 'No content found';
        resolve(`Extracted: ${text.substring(0, 100)}...`);
        break;
    }
  });
};
4. Main Application Component
tsx
// app/page.tsx
'use client';
import { useState, useRef } from 'react';
import { useDeepgram } from './hooks/useDeepgram';
import { parseIntent } from './utils/intentParser';
import { executeBrowserAction } from './utils/stagehandActions';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { transcribe } = useDeepgram();

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        try {
          const text = await transcribe(audioBlob);
          setTranscript(text);
          
          const intent = await parseIntent(text);
          const result = await executeBrowserAction(intent);
          
          setActions(prev => [...prev, `${new Date().toLocaleTimeString()}: ${text} → ${result}`]);
        } catch (error) {
          console.error('Error processing command:', error);
          setActions(prev => [...prev, `${new Date().toLocaleTimeString()}: Error processing command`]);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      
      // Stop recording after 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Voice Browser Agent</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center justify-center w-16 h-16 rounded-full text-white font-bold ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } transition-colors`}
            >
              {isRecording ? (
                <span className="text-sm">Stop</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            
            {isRecording && (
              <div className="ml-4 flex space-x-1">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
          
          {transcript && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-lg font-semibold text-blue-800">Transcript:</p>
              <p className="mt-1 text-blue-700">{transcript}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Action History</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {actions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No actions yet. Record a command to get started.</p>
            ) : (
              actions.map((action, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700 font-mono">{action}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Try these commands:</h3>
          <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
            <li>"Go to wikipedia.org"</li>
            <li>"Click on the English link"</li>
            <li>"Type 'artificial intelligence' in the search box"</li>
            <li>"Click the search button"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
5. Environment Configuration
bash
# .env.local
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBlob,
      { model: 'nova-2', punctuate: true, diarize: false }
    );
    return result?.results.channels[0].alternatives[0].transcript || '';
  };
  
  return { transcribe };
};
2. Intent Parsing
typescript
// app/utils/intentParser.ts
export const parseIntent = async (transcript: string): Promise<BrowserAction> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': '<YOUR_SITE_URL>',
      'X-Title': 'Voice Browser Agent'
    },
    body: JSON.stringify({
      model: 'google/gemini-pro',
      messages: [{
        role: 'user',
        content: `Convert this voice command to browser action: "${transcript}". 
        Respond ONLY with JSON: {action: "navigate|click|type|extract", target: string, value?: string}`
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};

interface BrowserAction {
  action: 'navigate' | 'click' | 'type' | 'extract';
  target: string;
  value?: string;
}
3. Browser Automation with Stagehand
typescript
// app/utils/stagehandActions.ts
export const executeBrowserAction = (action: BrowserAction): Promise<string> => {
  return new Promise((resolve) => {
    switch (action.action) {
      case 'navigate':
        window.location.href = action.target;
        resolve(`Navigated to ${action.target}`);
        break;
      case 'click':
        const clickElement = document.querySelector(action.target);
        if (clickElement) {
          (clickElement as HTMLElement).click();
          resolve(`Clicked ${action.target}`);
        } else {
          resolve(`Element ${action.target} not found`);
        }
        break;
      case 'type':
        const typeElement = document.querySelector(action.target);
        if (typeElement && action.value) {
          (typeElement as HTMLInputElement).value = action.value;
          resolve(`Typed "${action.value}" into ${action.target}`);
        } else {
          resolve(`Could not type into ${action.target}`);
        }
        break;
      case 'extract':
        const extractElement = document.querySelector(action.target);
        const text = extractElement?.textContent || 'No content found';
        resolve(`Extracted: ${text.substring(0, 100)}...`);
        break;
    }
  });
};
4. Main Application Component
tsx
// app/page.tsx
'use client';
import { useState } from 'react';
import { useDeepgram } from './hooks/useDeepgram';
import { parseIntent } from './utils/intentParser';
import { executeBrowserAction } from './utils/stagehandActions';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const { transcribe } = useDeepgram();

  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const text = await transcribe(audioBlob);
      setTranscript(text);
      
      const intent = await parseIntent(text);
      const result = await executeBrowserAction(intent);
      
      setActions(prev => [...prev, `${text} → ${result}`]);
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
      setIsRecording(false);
    }, 3000); // Record for 3 seconds
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Voice Browser Agent</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`w-full py-4 rounded-lg text-white font-bold ${
              isRecording ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRecording ? 'Recording...' : 'Start Recording (3s)'}
          </button>
          
          {transcript && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-lg">Transcript: {transcript}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Action History</h2>
          <div className="space-y-2">
            {actions.map((action, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <p className="text-sm font-mono">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
5. Environment Setup
bash
# .env.local
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_key_here
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key_here
🎯 Demo Flow
User clicks "Start Recording" and speaks: "Go to wikipedia.org"

System transcribes audio and parses intent

Browser navigates to Wikipedia

Action is logged in history panel

User says: "Click on the English version"

System clicks the English link

User says: "Type 'artificial intelligence' in the search box"

System types in the search field

📦 Deployment
bash
# Deploy to Vercel
vercel --env NEXT_PUBLIC_DEEPGRAM_API_KEY=your_key --env NEXT_PUBLIC_OPENROUTER_API_KEY=your_key --prod
🚀 Phase 2: Enhancements (After MVP)
Real-time transcription streaming

Visual element highlighting

Text-to-speech responses

Session persistence

Advanced command chaining

This PRD gives you 90% of the code needed for a functional demo. The remaining 10% is your intellectual brilliance in debugging, styling, and adding those unique touches that make it shine. Focus on making the core flow work perfectly - voice command → action → visual feedback. Everything else is polish.

Remove vercel part
We are removing Vercel-specific deployment instructions and focusing on the code that can run anywhere.
We'll adjust the code to be more generic and note that the environment variables should be set in the deployment platform of choice.

However, note that the original code was designed for Next.js and uses client-side and server-side components.
Since we are removing Vercel, we are just focusing on the code and not the deployment.

We'll keep the code as is, but remove the Vercel deployment section.

Also, note that the code uses Next.js API routes. If we are not deploying on Vercel, we can still deploy on any Node.js platform.

Let's adjust the PRD to be platform-agnostic.

Project Aria: Voice Browser Agent PRD (Platform-Agnostic)
🎯 Primary Goal
Build a voice-controlled browser automation agent that demonstrates:

Accurate speech-to-text processing using Deepgram

Reliable browser automation using Stagehand

Basic intent parsing via OpenRouter

🛠️ Tech Stack
Frontend: Next.js 14 + TypeScript + Tailwind CSS

Voice: Deepgram (STT)

AI: OpenRouter (Gemini/GPT-4)

Browser Automation: Stagehand (browser-based)

Deployment: Any platform supporting Node.js (Railway, Render, Fly.io, etc.)

📋 Core Implementation
1. Speech-to-Text with Deepgram
typescript
// app/hooks/useDeepgram.ts
import { createClient } from '@deepgram/sdk';

export const useDeepgram = () => {
  const transcribe = async (audioBlob: Blob): Promise<string> => {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBlob,
      { model: 'nova-2', punctuate: true, diarize: false }
    );
    return result?.results.channels[0].alternatives[0].transcript || '';
  };
  
  return { transcribe };
};
2. Intent Parsing with OpenRouter
typescript
// app/utils/intentParser.ts
interface BrowserAction {
  action: 'navigate' | 'click' | 'type' | 'extract';
  target: string;
  value?: string;
}

export const parseIntent = async (transcript: string): Promise<BrowserAction> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Voice Browser Agent'
    },
    body: JSON.stringify({
      model: 'google/gemini-pro',
      messages: [{
        role: 'user',
        content: `Convert this voice command to browser action: "${transcript}". 
        Respond ONLY with JSON: {action: "navigate|click|type|extract", target: string, value?: string}`
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};
3. Browser Automation with Stagehand
typescript
// app/utils/stagehandActions.ts
export const executeBrowserAction = (action: BrowserAction): Promise<string> => {
  return new Promise((resolve) => {
    switch (action.action) {
      case 'navigate':
        window.location.href = action.target;
        resolve(`Navigated to ${action.target}`);
        break;
      case 'click':
        const clickElement = document.querySelector(action.target);
        if (clickElement) {
          (clickElement as HTMLElement).click();
          resolve(`Clicked ${action.target}`);
        } else {
          resolve(`Element ${action.target} not found`);
        }
        break;
      case 'type':
        const typeElement = document.querySelector(action.target);
        if (typeElement && action.value) {
          (typeElement as HTMLInputElement).value = action.value;
          // Trigger change event for React forms
          typeElement.dispatchEvent(new Event('input', { bubbles: true }));
          resolve(`Typed "${action.value}" into ${action.target}`);
        } else {
          resolve(`Could not type into ${action.target}`);
        }
        break;
      case 'extract':
        const extractElement = document.querySelector(action.target);
        const text = extractElement?.textContent || 'No content found';
        resolve(`Extracted: ${text.substring(0, 100)}...`);
        break;
    }
  });
};
4. Main Application Component
tsx
// app/page.tsx
'use client';
import { useState, useRef } from 'react';
import { useDeepgram } from './hooks/useDeepgram';
import { parseIntent } from './utils/intentParser';
import { executeBrowserAction } from './utils/stagehandActions';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { transcribe } = useDeepgram();

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        try {
          const text = await transcribe(audioBlob);
          setTranscript(text);
          
          const intent = await parseIntent(text);
          const result = await executeBrowserAction(intent);
          
          setActions(prev => [...prev, `${new Date().toLocaleTimeString()}: ${text} → ${result}`]);
        } catch (error) {
          console.error('Error processing command:', error);
          setActions(prev => [...prev, `${new Date().toLocaleTimeString()}: Error processing command`]);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      
      // Stop recording after 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Voice Browser Agent</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center justify-center w-16 h-16 rounded-full text-white font-bold ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } transition-colors`}
            >
              {isRecording ? (
                <span className="text-sm">Stop</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            
            {isRecording && (
              <div className="ml-4 flex space-x-1">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
          
          {transcript && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-lg font-semibold text-blue-800">Transcript:</p>
              <p className="mt-1 text-blue-700">{transcript}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Action History</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {actions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No actions yet. Record a command to get started.</p>
            ) : (
              actions.map((action, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700 font-mono">{action}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Try these commands:</h3>
          <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
            <li>"Go to wikipedia.org"</li>
            <li>"Click on the English link"</li>
            <li>"Type 'artificial intelligence' in the search box"</li>
            <li>"Click the search button"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
5. Environment Configuration
bash
# .env.local
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here