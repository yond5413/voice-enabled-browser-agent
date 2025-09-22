import { BrowserAction } from '@/types';

/**
 * Executes a browser action by sending it to the backend API.
 * This function NO LONGER directly manipulates the DOM.
 * 
 * @param action The BrowserAction object describing the action to perform.
 * @returns A promise that resolves with a string describing the result from the backend.
 */
export const executeBrowserAction = async (action: BrowserAction): Promise<string> => {
  try {
    const response = await fetch('/api/agent/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.details || errorJson.error || `API request failed with status ${response.status}`);
      } catch {
        throw new Error(errorText || `API request failed with status ${response.status}`);
      }
    }

    const resultText = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(resultText);
    } catch {
      throw new Error(resultText || 'Invalid JSON response from server');
    }
    return parsed.result || 'Action executed successfully.';

  } catch (error: any) {
    console.error(`Error executing browser action via API for '${action.action}':`, error);
    // Re-throw the error to be caught by the calling function in page.tsx
    throw error;
  }
};