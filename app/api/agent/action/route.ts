import { NextResponse } from 'next/server';
import { BrowserAction } from '@/types';
import { Browser } from '@/utils/browserbase';
import { getAgentMemory } from '@/utils/utils';
import { addArtifact } from '@/utils/artifactsStore'

export const runtime = 'nodejs';

/**
 * @route POST /api/agent/action
 * @description Receives a browser action and executes it using the Stagehand SDK.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as any
    const action = body as BrowserAction
    const sessionId: string | undefined = body?.sessionId

    if (!action || !action.action) {
      return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 });
    }

    const result = await Browser.executeAction(action as any);

    // Capture a screenshot after action for observability
    try { await (Browser as any).captureScreenshot(sessionId, `After ${action.action}`) } catch {}

    // Log to memory for downstream intent context
    try {
      const mem = getAgentMemory()
    let url: string | undefined
    try {
      const here = await Browser.getCurrentContext()
      url = here?.url || undefined
    } catch {}
    mem.add({ transcript: `Action: ${action.action} → ${action.target}`, parsedAction: action, resultSummary: result, url })
    } catch {}

    // Record artifact for the action result
    try {
      if (sessionId) addArtifact(sessionId, { type: 'action', label: `Action: ${action.action}`, data: { action, result } })
    } catch {}

    return NextResponse.json({ result });

  } catch (error: any) {
    console.error('[API /action] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action.', details: error.message },
      { status: 500 }
    );
  }
}
