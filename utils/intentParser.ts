import { AgentAction } from '@/types';

// As per the PRD, this function interacts directly with OpenRouter from the client-side.
// For production applications, it's recommended to proxy this through a server-side API route 
// to keep the API key secure.

export const parseIntent = async (transcript: string, apiKey: string | undefined): Promise<AgentAction> => {
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
        model: 'deepseek/deepseek-chat-v3.1:free', 
        messages: [{
          role: 'user',
          content: `You are an intelligent assistant that converts voice commands into a structured action.

First, analyze the user's command: "${transcript}".

Second, decide on the appropriate action:
- If the command is a direct instruction with a clear target (e.g., "go to google.com"), create a 'BrowserAction'.
- If the command is a query or is ambiguous but can be resolved with a web search (e.g., "find me a good recipe for pasta"), create a 'BrowserAction' to navigate to a Google search URL.
- If the command is too ambiguous to confidently perform any action or search (e.g., "click the button", "delete the item"), create a 'ClarifyAction' to ask the user for more details.

Third, respond ONLY with a valid JSON object for the chosen action.

Action Formats:
1. BrowserAction: {action: "navigate|click|type|extract", target: "<CSS_SELECTOR_OR_URL>", value?: "<string_to_type>"}
2. ClarifyAction: {action: "clarify", question: "<string_to_ask_user>"}

For search queries, use a BrowserAction with "navigate" and a target of "https://www.google.com/search?q=<your_search_query>".

Example 1 (BrowserAction - Search):
Command: "Search for the weather in New York."
Response: {"action": "navigate", "target": "https://www.google.com/search?q=weather+in+New+York"}

Example 2 (BrowserAction - Direct):
Command: "Go to wikipedia."
Response: {"action": "navigate", "target": "https://www.wikipedia.org"}

Example 3 (ClarifyAction):
Command: "Click the link."
Response: {"action": "clarify", "question": "Which link would you like me to click?"}

Now, process this command: "${transcript}"`
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
