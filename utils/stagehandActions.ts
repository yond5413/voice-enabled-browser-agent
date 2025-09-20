import { BrowserAction } from '@/types';

/**
 * Executes a browser action based on the provided command.
 * This function directly manipulates the DOM and browser navigation.
 * 
 * @param action The BrowserAction object describing the action to perform.
 * @returns A promise that resolves with a string describing the result of the action.
 */
export const executeBrowserAction = (action: BrowserAction): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      switch (action.action) {
        case 'navigate':
          if (!action.target) return reject('No navigation target specified.');
          let url = action.target;
          if (!url.startsWith('http')) {
            url = `https://${url}`;
          }
          window.location.href = url;
          resolve(`Navigated to ${action.target}`);
          break;

        case 'click':
          if (!action.target) return reject('No click target specified.');
          const clickElement = document.querySelector(action.target) as HTMLElement;
          if (clickElement) {
            clickElement.click();
            resolve(`Clicked on element: ${action.target}`);
          } else {
            reject(`Element not found for selector: ${action.target}`);
          }
          break;

        case 'type':
          if (!action.target) return reject('No typing target specified.');
          if (typeof action.value === 'undefined') return reject('No value specified for typing.');
          
          const typeElement = document.querySelector(action.target) as HTMLInputElement | HTMLTextAreaElement;
          if (typeElement) {
            typeElement.value = action.value;
            // Dispatch events to ensure frameworks like React detect the change
            typeElement.dispatchEvent(new Event('input', { bubbles: true }));
            typeElement.dispatchEvent(new Event('change', { bubbles: true }));
            resolve(`Typed "${action.value}" into element: ${action.target}`);
          } else {
            reject(`Element not found for selector: ${action.target}`);
          }
          break;

        case 'extract':
          if (!action.target) return reject('No extraction target specified.');
          const extractElement = document.querySelector(action.target);
          if (extractElement) {
            const text = (extractElement as HTMLElement).innerText || extractElement.textContent || '';
            const extractedText = text.trim().substring(0, 200);
            resolve(`Extracted text: "${extractedText}..."`);
          } else {
            reject(`Element not found for selector: ${action.target}`);
          }
          break;

        default:
          reject('Unknown action type.');
      }
    } catch (error: any) {
      console.error(`Error executing browser action '${action.action}':`, error);
      reject(error.message || 'An unknown error occurred.');
    }
  });
};