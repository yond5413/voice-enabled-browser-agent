import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type SessionHistoryItem = { role: 'user' | 'agent', content: string }
type SessionContext = { history: SessionHistoryItem[] }

const sessionStore: Record<string, SessionContext> = {}

export async function POST (request: Request) {
  try {
    const body = await request.json()
    const { sessionId, transcript, openRouterApiKey } = body || {}

    if (!sessionId || !transcript) {
      return NextResponse.json({ error: 'sessionId and transcript are required' }, { status: 400 })
    }

    // 1) Retrieve or initialize session history
    if (!sessionStore[sessionId]) sessionStore[sessionId] = { history: [] }
    const ctx = sessionStore[sessionId]
    ctx.history.push({ role: 'user', content: transcript })

    // 3) Parse intent server-side via existing backend endpoint
    const intentRes = await fetch(new URL('/api/agent/intent', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, openRouterApiKey })
    })

    if (!intentRes.ok) {
      const errText = await intentRes.text()
      return NextResponse.json({ error: 'Intent parsing failed', details: errText }, { status: intentRes.status })
    }

    const agentAction = await intentRes.json()

    // 4) If clarify, just return question
    if (agentAction?.action === 'clarify') {
      const result = { type: 'clarify', question: agentAction.question }
      ctx.history.push({ role: 'agent', content: `Clarify: ${agentAction.question}` })
      return NextResponse.json(result)
    }

    // 5) Execute browser action via backend /action route (handles memory logging)
    const actionRes = await fetch(new URL('/api/agent/action', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentAction)
    })

    if (!actionRes.ok) {
      const errText = await actionRes.text()
      return NextResponse.json({ error: 'Action execution failed', details: errText }, { status: actionRes.status })
    }

    const actionData = await actionRes.json()
    const execSummary = actionData?.result || 'Action executed.'

    ctx.history.push({ role: 'agent', content: execSummary })

    return NextResponse.json({ type: 'action', result: execSummary, history: ctx.history })
  } catch (error: any) {
    console.error('[API /converse] Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 })
  }
}


