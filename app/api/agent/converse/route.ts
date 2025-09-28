import { NextResponse } from 'next/server'
import { addArtifact } from '@/utils/artifactsStore'
import { appendHistory, getSessionContext } from '@/utils/sessionStore'

export const runtime = 'nodejs'

// use shared session store

export async function POST (request: Request) {
  try {
    const body = await request.json()
    const { sessionId, transcript, openRouterApiKey } = body || {}

    if (!sessionId || !transcript) {
      return NextResponse.json({ error: 'sessionId and transcript are required' }, { status: 400 })
    }

    // 1) Append user message with timestamp to history and artifact
    appendHistory(sessionId, 'user', transcript)
    try { addArtifact(sessionId, { type: 'log', label: 'Transcript', data: { transcript } }) } catch {}

    // 3) Parse intent server-side via existing backend endpoint
    const intentRes = await fetch(new URL('/api/agent/intent', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, openRouterApiKey, sessionId })
    })

    if (!intentRes.ok) {
      const errText = await intentRes.text()
      return NextResponse.json({ error: 'Intent parsing failed', details: errText }, { status: intentRes.status })
    }

    const agentAction = await intentRes.json()

    // 4) If clarify, just return question
    if (agentAction?.action === 'clarify') {
      const result = { type: 'clarify', question: agentAction.question }
      appendHistory(sessionId, 'agent', `Clarify: ${agentAction.question}`)
      return NextResponse.json(result)
    }

    // 5) Execute action(s) via backend /action route (handles memory logging)
    const executeOne = async (action: any) => {
      const res = await fetch(new URL('/api/agent/action', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...action, sessionId })
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Action execution failed')
      }
      return res.json()
    }

    let execSummary = 'Action executed.'
    if (Array.isArray((agentAction as any)?.actions)) {
      let last
      for (const step of (agentAction as any).actions) {
        last = await executeOne(step)
      }
      execSummary = last?.result || execSummary
    } else {
      const single = await executeOne(agentAction)
      execSummary = single?.result || execSummary
    }

    appendHistory(sessionId, 'agent', execSummary)

    const ctx = getSessionContext(sessionId)
    return NextResponse.json({ type: 'action', result: execSummary, history: ctx.history })
  } catch (error: any) {
    console.error('[API /converse] Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 })
  }
}


