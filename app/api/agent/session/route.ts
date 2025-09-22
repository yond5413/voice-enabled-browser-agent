import { NextResponse } from 'next/server';
import { Browser } from '@/utils/browserbase';

export const runtime = 'nodejs';

/**
 * @route GET /api/agent/session
 * @description Initializes the browser session via Stagehand and returns the 
 * live view URL to the client.
 */
export async function GET() {
  try {
    const sessionViewUrl = await Browser.getSessionViewUrl();

    if (!sessionViewUrl) {
      return NextResponse.json(
        { error: 'Failed to retrieve browser session view URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionViewUrl });
  } catch (error: any) {
    console.error('[API /session] Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.', details: error.message },
      { status: 500 }
    );
  }
}
