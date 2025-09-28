import { type NextRequest } from 'next/server'
import { globalModelFallback, ModelConfig } from '@/utils/modelConfig'
import { Browser } from '@/utils/browserbase'
import { addArtifact } from '@/utils/artifactsStore'
import { getAgentMemory, summarizeForPrompt } from '@/utils/utils'
import { getSessionHistory } from '@/utils/sessionStore'

export const runtime = 'nodejs'

export async function POST (request: NextRequest) {
  const { transcript, openRouterApiKey, sessionId } = await request.json()

  if (!openRouterApiKey) {
    return new Response('OpenRouter API key is not set.', { status: 500 })
  }

  try {
    let location = ''
    let sessionHistoryBlock = ''
  let snapshot = ''
    // Proactively refresh page context via Stagehand extract to avoid stale state
    try {
      await (Browser as any).updatePageContext()
    } catch {}
    try {
      const here = await Browser.getCurrentContext()
      if (here?.url || here?.title) {
        location = `CURRENT LOCATION: ${here.title || ''} | ${here.url || ''}`
      }
    } catch {}
  try {
    snapshot = await Browser.getTextualSnapshot()
  } catch {}
    try {
      if (sessionId) {
        const history = getSessionHistory(sessionId) || []
        if (history.length > 0) {
          const recent = history.slice(-8)
          sessionHistoryBlock = `SESSION HISTORY (most recent last):\n${recent.map(h => `[${h.role}] ${h.content}`).join('\n')}`
        }
      }
    } catch {}
    const result = await globalModelFallback.tryWithFallback(async (model: ModelConfig) => {
      console.log(`🤖 Trying intent parsing with ${model.displayName}`)
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': request.headers.get('origin') || '',
          'X-Title': 'Project Aria Voice Agent'
        },
        body: JSON.stringify({
          model: model.name,
          messages: [{
            role: 'user',
            content: `You are an intelligent web automation assistant. Convert voice commands into structured browser actions using natural, human-like interactions.

RECENT CONTEXT (most recent last):
${(() => { try { const mem = getAgentMemory(); return summarizeForPrompt(mem.getRecent(10)) || '(no prior context)' } catch { return '(no prior context)' } })()}

${location}

${snapshot ? `PAGE SNAPSHOT:\n${snapshot}` : ''}

${sessionHistoryBlock}

COMMAND TO ANALYZE: "${transcript}"

DECISION PROCESS:
1. Direct navigation (specific websites): Use "navigate" action
2. Search queries (questions, research, "find"): Use "navigate" to Google with natural search terms
3. Page interactions (click, type, extract, press): Use appropriate action with descriptive, human-readable targets
4. Ambiguous commands: First ground your understanding in CURRENT LOCATION and PAGE SNAPSHOT. Only use "clarify" if ambiguity remains after considering visible context.
5. If the intent requires multiple steps (e.g., navigate → type → press enter), return an action plan with an "actions" array in correct order.

ACTION FORMATS:
- BrowserAction: {"action": "navigate|click|type|extract|press", "target": "<human_readable_description_or_url_or_key>", "value": "<text_for_typing>"}
- ClarifyAction: {"action": "clarify", "question": "<specific_question>"}
- ActionPlan: {"actions": [BrowserAction, ...]}

SEARCH STRATEGY:
For search queries, DO NOT return a direct Google search URL. Instead, return a navigate action whose target is a natural query prefixed with the word "google". The executor will open Google and type it like a human.
- "weather in New York" → navigate target: "google weather New York current conditions"
- "best restaurants" → navigate target: "google best restaurants near me reviews"
- "how to cook pasta" → navigate target: "google how to cook pasta step by step guide"

INTERACTION TARGETS:
Use human-readable descriptions instead of technical selectors:
- "search box" or "main search field" 
- "login button" or "sign in link"
- "navigation menu" or "hamburger menu"

EXAMPLES:

Search Query:
Command: "What's the weather like in New York?"
Response: {"action": "navigate", "target": "google weather New York current conditions forecast"}

Direct Navigation:
Command: "Go to Wikipedia"
Response: {"action": "navigate", "target": "https://www.wikipedia.org"}

Page Interaction:
Command: "Type 'machine learning' in the search box"
Response: {"action": "type", "target": "search box", "value": "machine learning"}

Multi-step Plan:
Command: "On Amazon, search for wireless headphones"
Response: {"actions": [
  {"action": "navigate", "target": "https://www.amazon.com"},
  {"action": "type", "target": "search box at top of page", "value": "wireless headphones"},
  {"action": "press", "target": "Enter"}
]}

Extraction:
Command: "Get the main headline from this page"
Response: {"action": "extract", "target": "main headline or title"}

Clarification:
Command: "Click it"
Response: {"action": "clarify", "question": "What specifically would you like me to click? Please describe the button, link, or element."}

RESPOND WITH ONLY ONE OF:
- a single action object, or
- an object with an "actions" array (multi-step plan)

FOR: "${transcript}"`
          }]
        })
      })

      if (!response.ok) {
        const errorBody = await response.text()
        const error = new Error(`API Error: ${response.status} ${errorBody}`)
        ;(error as any).status = response.status
        console.error(`❌ ${model.displayName} failed with status ${response.status}:`, errorBody)
        throw error
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      const jsonContent = content.replace(/```json\n|```/g, '').trim()
      console.log(`✅ ${model.displayName} successfully parsed intent`)
      
      // Store transcript and parsed action as artifact
      try {
        const parsed = JSON.parse(jsonContent)
        if (sessionId) {
          addArtifact(sessionId, { type: 'intent', label: 'Parsed Intent', data: { transcript, action: parsed } })
        }
      } catch {}

      return jsonContent
    })

    return new Response(result, {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (e: any) {
    console.error('❌ All intent parsing models failed:', e.message)
    
    // Provide more helpful error messages
    let errorMessage = e.message || 'Unknown parsing error'
    let statusCode = 500
    
    if (e.message?.includes('rate limit') || e.message?.includes('429')) {
      errorMessage = 'All AI models are currently rate-limited. Please try again in a few moments.'
      statusCode = 429
    } else if (e.message?.includes('API Error')) {
      // Pass through API errors as-is
      statusCode = e.status || 500
    }
    
    return new Response(errorMessage, { status: statusCode })
  }
}
