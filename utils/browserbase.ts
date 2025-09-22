import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { BrowserAction } from "@/types";

// Initialize the Stagehand instance
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  modelName: "deepseek/deepseek-chat-v3.1:free",
  modelClientOptions: {
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  },
});

let isInitialized = false;
let session: unknown | null = null;
let sessionTimestamp: number | null = null;

const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * A wrapper to interact with the browser via the Stagehand SDK.
 */
export const Browser = {
  // Lazily access the page only after Stagehand has been initialized
  async getPage() {
    await this.initialize();
    return stagehand.page;
  },

  /**
   * Initializes the Stagehand session and stores the session object.
   */
  async initialize() {
    const now = Date.now();
    if (isInitialized && session && sessionTimestamp && (now - sessionTimestamp < SESSION_CACHE_DURATION)) {
      return;
    }

    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID || !process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      throw new Error(
        "BrowserBase or OpenRouter environment variables are not configured. Please set BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, and NEXT_PUBLIC_OPENROUTER_API_KEY."
      );
    }
    
    console.log("Initializing Stagehand...");
    session = await stagehand.init();
    isInitialized = true;
    sessionTimestamp = Date.now();
    console.log("Stagehand Initialized.");
  },

  /**
   * Executes a structured BrowserAction using the Stagehand page object.
   * @param action The BrowserAction to execute.
   * @returns A promise that resolves with a string describing the result.
   */
  async executeAction(action: BrowserAction): Promise<string> {
    const page = await this.getPage();

    switch (action.action) {
      case "navigate":
        await page.goto(action.target);
        return `Navigated to ${action.target}`;

      case "click":
        await page.act(`Click the ${action.target}`);
        return `Clicked on \"${action.target}\"`;

      case "type":
        await page.act(`Type \"${action.value}\" in the ${action.target}`);
        return `Typed \"${action.value}\" in \"${action.target}\"`;

      case "extract":
        const data = await page.extract({ 
          instruction: action.target, 
          schema: z.object({ text: z.string() }) 
        });
        return `Extracted data: ${JSON.stringify(data)}`;

      default:
        throw new Error(`Unsupported action type: ${(action as any).action}`);
    }
  },

  /**
   * Gets the URL for the live view of the current session.
   */
  async getSessionViewUrl(): Promise<string> {
    await this.initialize();
    
    if (!session) {
      throw new Error("Stagehand session is not available after initialization.");
    }

    const liveViewUrl = (session as any)?.debugUrl;

    if (typeof liveViewUrl === 'string' && liveViewUrl.length > 0) {
      return liveViewUrl;
    }

    throw new Error("Live view URL is not available on the Stagehand session.");
  },
};

// Backwards-compatibility wrapper for existing routes expecting BrowserBase API
export const BrowserBase = {
  async getSessionId(): Promise<string> {
    // Stagehand manages sessions internally; return a placeholder ID for compatibility
    await Browser.initialize();
    return "stagehand-session";
  },

  async executeAction(_sessionId: string, action: BrowserAction): Promise<string> {
    // Ignore sessionId; Stagehand uses internal session
    return Browser.executeAction(action);
  },

  async getSessionViewUrl(): Promise<string> {
    return Browser.getSessionViewUrl();
  },
};