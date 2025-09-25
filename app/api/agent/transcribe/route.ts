import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  if (!deepgramApiKey) {
    console.error('DEEPGRAM_API_KEY environment variable is not set');
    return new Response("Deepgram API key is not set.", { status: 500 });
  }

  try {
    const audioBlob = await request.blob();
    const response = await fetch("https://api.deepgram.com/v1/listen", {
      method: "POST",
      headers: {
        "Authorization": `Token ${deepgramApiKey}`,
        "Content-Type": "audio/webm",
      },
      body: audioBlob,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return new Response(`Deepgram API request failed: ${errorBody}`, { status: response.status });
    }

    const result = await response.json();
    console.log('Deepgram API response:', JSON.stringify(result, null, 2));
    
    // Safely access the transcript with proper error handling
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    
    if (!transcript) {
      console.error('Invalid response structure from Deepgram:', result);
      return new Response('No transcript found in Deepgram response', { status: 500 });
    }

    return new Response(JSON.stringify({ transcript }), { 
      headers: { "Content-Type": "application/json" }
    });

  } catch (e: any) {
    console.error('Error in transcribe endpoint:', e);
    return new Response(e.message || "Unknown transcription error", { status: 500 });
  }
}
