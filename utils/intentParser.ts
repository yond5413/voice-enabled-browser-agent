import { AgentAction } from '@/types';

// As per the PRD, this function interacts directly with OpenRouter from the client-side.
// For production applications, it's recommended to proxy this through a server-side API route 
// to keep the API key secure.

export const parseIntent = async (transcript: string, apiKey: string | undefined): Promise<AgentAction> => {
  if (!apiKey) {
    console.error('OpenRouter API key is not set.');
    return Promise.reject('OpenRouter API key not configured.');
  }

  try {
    const response = await fetch('/api/agent/intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript, openRouterApiKey: apiKey })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API error:', response.status, errorBody);
      return Promise.reject(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();

  } catch (e: any) {
    console.error('An exception occurred during intent parsing:', e);
    return Promise.reject(e.message || 'Unknown parsing error');
  }
};
