import { NextResponse } from 'next/server';
import { BrowserAction } from '@/types';
import { Browser } from '@/utils/browserbase';
import { getAgentMemory } from '@/utils/utils';

export const runtime = 'nodejs';

/**
 * @route POST /api/agent/action
 * @description Receives a browser action and executes it using the Stagehand SDK.
 */
export async function POST(request: Request) {
  try {
    const action = (await request.json()) as BrowserAction;

    if (!action || !action.action) {
      return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 });
    }

    const result = await Browser.executeAction(action);

    // Log to memory for downstream intent context
    try {
      const mem = getAgentMemory()
      let url: string | undefined
      try { url = await Browser.getSessionViewUrl() } catch {}
      mem.add({ transcript: `Action: ${action.action} → ${action.target}`, parsedAction: action, resultSummary: result, url })
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
