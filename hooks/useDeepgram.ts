'use client'

import { createClient } from '@deepgram/sdk'
import { useCallback } from 'react'

// As per the PRD, this hook interacts directly with Deepgram from the client-side.
// For production applications, it's recommended to proxy this through a server-side API route 
// to keep the API key secure.

export const useDeepgram = (apiKey: string | undefined) => {

  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    if (!apiKey) {
      console.error('Deepgram API key is not set.');
      return 'Error: Deepgram API key not configured.';
    }

    const deepgram = createClient(apiKey);
    try {
      const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        audioBlob,
        { model: 'nova-2', punctuate: true, diarize: false }
      );

      if (error) {
        console.error('Deepgram transcription error:', error);
        return `Error: ${error.message}`;
      }

      return result?.results.channels[0].alternatives[0].transcript || '';
    } catch (e: any) {
      console.error('An exception occurred during transcription:', e);
      return `Error: ${e.message || 'Unknown transcription error'}`;
    }
  }, [apiKey]);
  
  return { transcribe };
};