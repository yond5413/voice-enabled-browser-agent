import { BrowserAction } from '@/types';

// As per the PRD, this function interacts directly with OpenRouter from the client-side.
// For production applications, it's recommended to proxy this through a server-side API route 
// to keep the API key secure.

export const parseIntent = async (transcript: string, apiKey: string | undefined): Promise<BrowserAction> => {
  if (!apiKey) {
    console.error('OpenRouter API key is not set.');
    // Return a default or error action
    return Promise.reject('OpenRouter API key not configured.');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Required headers for OpenRouter free tier
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Project Aria Voice Agent'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro', // Or any other suitable model
        messages: [{
          role: 'user',
          content: `Convert the following voice command into a structured browser action. The command is: "${transcript}". Respond ONLY with a valid JSON object matching this format: {action: "navigate|click|type|extract", target: "<CSS_SELECTOR_OR_URL>", value?: "<string_to_type>"}`
        }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenRouter API error:', response.status, errorBody);
      return Promise.reject(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Clean the content to ensure it is valid JSON
    const jsonContent = content.replace(/```json\n|```/g, '').trim();
    
    return JSON.parse(jsonContent);

  } catch (e: any) {
    console.error('An exception occurred during intent parsing:', e);
    return Promise.reject(e.message || 'Unknown parsing error');
  }
};
