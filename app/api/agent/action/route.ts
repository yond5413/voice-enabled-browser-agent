import { NextResponse } from 'next/server';
import { BrowserAction } from '@/types';
import { Browser } from '@/utils/browserbase';

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

    return NextResponse.json({ result });

  } catch (error: any) {
    console.error('[API /action] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action.', details: error.message },
      { status: 500 }
    );
  }
}
