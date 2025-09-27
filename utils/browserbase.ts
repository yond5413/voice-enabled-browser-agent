import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { BrowserAction } from "@/types";
import { globalModelFallback, ModelConfig } from "./modelConfig";
import { sleep, getAgentMemory } from "./utils";

declare global {
  // eslint-disable-next-line no-var
  var __stagehandStore__: {
    stagehand: Stagehand | null;
    session: unknown | null;
    isInitialized: boolean;
    sessionTimestamp: number | null;
    initPromise: Promise<void> | null;
    currentModel: ModelConfig | null;
    lastError: Error | null;
    lastKnownUrl?: string | null;
    lastKnownTitle?: string | null;
  } | undefined;
}

const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const shouldUseProxiesByDefault = process.env.BROWSERBASE_USE_PROXIES === "true";
const preferredRegion = process.env.BROWSERBASE_REGION;
const keepAliveEnabled = process.env.BROWSERBASE_KEEP_ALIVE === "true";
const envOs = process.env.BROWSERBASE_OS;
const advancedStealthEnabled = process.env.BROWSERBASE_ADVANCED_STEALTH === "true";
let resolvedOs = envOs || "linux"; // Basic stealth supports Linux only
if (!advancedStealthEnabled && resolvedOs !== "linux") {
  console.warn(
    `BROWSERBASE_OS='${resolvedOs}' requires advanced stealth. Forcing 'linux' while advanced stealth is disabled.`
  );
  resolvedOs = "linux";
}
// advancedStealthEnabled declared above

const store = (globalThis as any).__stagehandStore__ ?? ((globalThis as any).__stagehandStore__ = {
  stagehand: null,
  session: null,
  isInitialized: false,
  sessionTimestamp: null,
  initPromise: null,
  currentModel: null,
  lastError: null,
  lastKnownUrl: null,
  lastKnownTitle: null,
});

function createStagehandForModel(model: ModelConfig, useProxies: boolean): Stagehand {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID || !openaiKey) {
    throw new Error(
      "Browserbase or OpenAI environment variables are not configured. Please set BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, and OPENAI_API_KEY."
    );
  }

  const sessionParams: any = {
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    browserSettings: {
      solveCaptchas: true,
      advancedStealth: advancedStealthEnabled,
      os: resolvedOs,
      viewport: {
        width: 1920,
        height: 1080,
      },
    },
  };
  if (preferredRegion) sessionParams.region = preferredRegion;
  if (keepAliveEnabled) sessionParams.keepAlive = true;

  if (useProxies) {
    sessionParams.proxies = true;
  }

  // Resolve model name for OpenAI provider; if configured model is not OpenAI, fall back to a cost-effective OpenAI default
  const resolvedModelName = model.provider === "openai" ? model.name : "gpt-4o-mini";

  console.log(`Creating new Stagehand instance with model: ${model.displayName} → using OpenAI model '${resolvedModelName}' (proxies=${useProxies})`);

  return new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    modelName: resolvedModelName,
   // headless: false,
    domSettleTimeoutMs: 30000,
    modelClientOptions: {
      apiKey: openaiKey,
    },
    browserbaseSessionCreateParams: sessionParams,
  });
}

function ensureStagehand(): Stagehand {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID || !openaiKey) {
    throw new Error(
      "Browserbase or OpenAI environment variables are not configured. Please set BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, and OPENAI_API_KEY."
    );
  }

  const currentModel = store.currentModel || globalModelFallback.getCurrentModel();

  if (!store.stagehand) {
    store.stagehand = createStagehandForModel(currentModel, shouldUseProxiesByDefault);
    store.currentModel = currentModel;
  }

  return store.stagehand as Stagehand;
}

async function ensureStagehandWithFallback(): Promise<void> {
  await globalModelFallback.tryWithFallback(async (model) => {
    // Build with default proxies setting
    let stagehand = createStagehandForModel(model, shouldUseProxiesByDefault);

    try {
      const session = await stagehand.init();
      store.stagehand = stagehand;
      store.session = session;
      store.currentModel = model;
      try {
        const region = (session as any)?.region;
        const proxyBytes = (session as any)?.proxyBytes;
        console.log(`Browserbase session ready${region ? ` in ${region}` : ''}${typeof proxyBytes === 'number' ? ` | proxyBytes=${proxyBytes}` : ''}`);
      } catch {
        // best-effort logging only
      }
      return;
    } catch (error: any) {
      const message = error?.message || '';
      const is402 = message.includes('402') || message.toLowerCase().includes('proxies are not included in the free plan');
      if (shouldUseProxiesByDefault && is402) {
        console.warn('Received 402 due to proxies on free plan. Retrying without proxies...');
        // Retry without proxies
        stagehand = createStagehandForModel(model, false);
        const session = await stagehand.init();
        store.stagehand = stagehand;
        store.session = session;
        store.currentModel = model;
        return;
      }
      console.error(`Model ${model.displayName} failed during initialization:`, error.message);
      throw error;
    }
  });
}

async function initialize(): Promise<void> {
  const now = Date.now();
  const expired = !store.sessionTimestamp || now - (store.sessionTimestamp as number) >= SESSION_CACHE_DURATION;

  if (store.isInitialized && store.session && !expired && store.stagehand) return;
  if (store.initPromise) {
    await store.initPromise;
    return;
  }

  store.initPromise = (async () => {
    console.log("Initializing Stagehand with fallback models...");
    
    try {
      await ensureStagehandWithFallback();
      store.isInitialized = true;
      store.sessionTimestamp = Date.now();
      store.lastError = null;
      
      const modelStatus = globalModelFallback.getStatus();
      console.log(`✅ Stagehand initialized successfully with ${modelStatus.currentModel.displayName}`);
      
    } catch (error: any) {
      console.error("❌ Failed to initialize Stagehand with all fallback models:", error);
      store.lastError = error;
      throw error;
    }
  })().finally(() => {
    store.initPromise = null;
  });

  await store.initPromise;
}

/**
 * A wrapper to interact with the browser via the Stagehand SDK.
 */
export const Browser = {
  async getPage() {
    await initialize();
    const page = ensureStagehand().page;
    // Ensure landing on Google for stable starting context
    if (!store.lastKnownUrl) {
      try {
        await this.ensureGoogleHome(page);
      } catch (e) {
        console.warn("Failed to ensure Google home:", (e as any)?.message);
      }
    }
    return page;
  },

  async executeAction(action: BrowserAction): Promise<string> {
    return await globalModelFallback.tryWithFallback(async (model) => {
      const page = await this.getPage();
      
      try {
        // Add human-like delay before actions
        await this.addHumanDelay();
        
        switch (action.action) {
          case "navigate":
            if (/^https?:\/\//i.test(action.target)) {
              await page.goto(action.target);
            } else if (action.target.includes('google.com/search?q=')) {
              // legacy intent may produce full search URL; go directly
              await page.goto(action.target);
            } else if (/^google\s/i.test(action.target) || /\bsearch\b/i.test(action.target)) {
              await page.goto("https://www.google.com");
              await this.addHumanDelay(800, 1600);
              try {
                const fields = await page.observe("Find the main Google search input field");
                if (fields && fields.length > 0) {
                  const query = action.target.replace(/^google\s*/i, '').trim();
                  await page.act({
                    action: "Click on the search input and then type %q%",
                    variables: { q: query || action.target },
                    domSettleTimeoutMs: 30000,
                  });
                  await this.addHumanDelay(600, 1400);
                  await page.act("press Enter to submit the search");
                } else {
                  await page.act({ action: "type %q% into the search box", variables: { q: action.target } });
                  await page.act("press Enter to submit the search");
                }
                // Scroll a bit to look human and reveal results
                await this.addHumanDelay(800, 1600);
                await page.act("scroll down a little");
              } catch (e) {
                await page.goto(`https://www.google.com/search?q=${encodeURIComponent(action.target)}`);
              }
            } else if (/^www\.|^google\./i.test(action.target)) {
              await page.goto(`https://${action.target}`);
            } else {
              // Treat any non-URL as a Google query for robustness
              await page.goto("https://www.google.com");
              await this.addHumanDelay(600, 1400);
              try {
                const fields = await page.observe("Find the main Google search input field");
                const query = action.target.trim();
                if (fields && fields.length > 0) {
                  await page.act({
                    action: "Click on the search input and then type %q%",
                    variables: { q: query },
                    domSettleTimeoutMs: 30000,
                  });
                } else {
                  await page.act({ action: "type %q% into the search box", variables: { q: query } });
                }
                await this.addHumanDelay(500, 1200);
                await page.act("press Enter to submit the search");
              } catch (e) {
                await page.goto(`https://www.google.com/search?q=${encodeURIComponent(action.target)}`);
              }
            }
            // Wait for page to fully load and settle
            await page.act("wait for the page to fully load");
            await this.addHumanDelay(600, 1400);
            // minor scroll to reduce bot heuristics
            try { await page.act("scroll down slightly"); } catch {}
            // Update page context in memory
            try { await this.updatePageContext(page); } catch {}
            return `Navigated to ${action.target}`;
            
          case "click":
            // Enhanced observe-first strategy with better prompting
            try {
              const candidates = await page.observe(`Find clickable elements related to "${action.target}" on this page`);
              if (candidates && candidates.length > 0) {
                const bestMatch = candidates[0];
                if (bestMatch.method === "click") {
                  // Add small delay before clicking
                  await this.addHumanDelay(500, 1500);
                  await page.act(bestMatch);
                  return `Clicked on "${action.target}" using observed element: ${bestMatch.description}`;
                }
              }
            } catch (observeError) {
              console.log("Observe failed for click, falling back to direct act:", observeError);
            }
            
            // Fallback with more natural phrasing
            await page.act(`click on the ${action.target}`);
            return `Clicked on "${action.target}"`;
            
          case "type":
            // Enhanced typing with human-like behavior
            try {
              const fields = await page.observe(`Find input fields or search boxes for "${action.target}"`);
              if (fields && fields.length > 0) {
                const targetField = fields[0];
                
                // Human-like typing with delays and variables
                await page.act({
                  action: `Click on the ${targetField.description} and then type %searchText%`,
                  variables: { searchText: String(action.value ?? "") },
                  iframes: true,
                  domSettleTimeoutMs: 45000,
                  timeoutMs: 60000,
                });
                
                // Add delay before potential enter/submit
                await this.addHumanDelay(800, 2000);
                return `Typed "${action.value}" in "${action.target}" using observed field`;
              }
            } catch (observeError) {
              console.log("Observe failed for type, falling back to direct act:", observeError);
            }
            
            // Fallback with more natural phrasing
            await page.act({
              action: `type "%searchText%" into the ${action.target}`,
              variables: { searchText: String(action.value ?? "") }
            });
            return `Typed "${action.value}" in "${action.target}"`;
            
          case "extract":
            // Wait for dynamic content to load first
            await page.act("wait for the content to finish loading");
            await this.addHumanDelay(1000, 2000);
            
            // Enhanced extraction with observe-scoped targeting
            let selector: string | undefined;
            let contextDescription = "";
            
            try {
              const elements = await page.observe(`Find content areas or sections containing information about "${action.target}"`);
              if (elements && elements.length > 0) {
                selector = elements[0].selector;
                contextDescription = elements[0].description;
              }
            } catch (observeError) {
              console.log("Observe failed for extract, proceeding without selector:", observeError);
            }
            
            const extractInstruction = typeof action.target === "string" && action.target.trim().length > 0
              ? `Extract ${action.target}${contextDescription ? ` from ${contextDescription}` : ""}`
              : "extract the relevant text content from this page";
            
            const data = await page.extract({
              instruction: extractInstruction,
              schema: z.object({ 
                text: z.string().describe("The extracted text content"),
                source: z.string().optional().describe("Source or context of the extracted information")
              }),
              ...(selector ? { selector } : {}),
              domSettleTimeoutMs: 30000,
            });
            
            try { await this.updatePageContext(page); } catch {}
            return `Extracted data: ${JSON.stringify(data)}`;
            
          default:
            throw new Error(`Unsupported action type: ${(action as any).action}`);
        }
      } catch (error: any) {
        console.error(`Action failed with ${model.displayName}:`, error.message);
        // If this looks like a model-related error, try to reinitialize
        if (this.isModelRelatedError(error)) {
          console.log("Detected model-related error, forcing reinitialization...");
          store.stagehand = null;
          store.session = null;
          store.isInitialized = false;
        }
        // If Google flagged as bot, try recoveries
        const msg = (error?.message || '').toLowerCase();
        if (msg.includes('unusual traffic') || msg.includes('captcha') || msg.includes('bot')) {
          try {
            await this.addHumanDelay(1200, 2200);
            await page.act("scroll up and down slowly");
            await this.addHumanDelay(1000, 1800);
          } catch {}
        }
        throw error;
      }
    });
  },

  isModelRelatedError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('rate limit') ||
           message.includes('model') ||
           message.includes('api key') ||
           message.includes('unauthorized') ||
           message.includes('forbidden') ||
           error.status === 401 ||
           error.status === 403 ||
           error.status === 429;
  },

  /**
   * Add human-like delays to make interactions appear more natural
   */
  async addHumanDelay(minMs: number = 300, maxMs: number = 1000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  },

  async ensureGoogleHome(page?: any): Promise<void> {
    const p = page || (await this.getPage());
    try {
      await p.goto("https://www.google.com/ncr");
      await this.addHumanDelay(600, 1200);
      // Handle consent if present
      try {
        const buttons = await p.observe("Find a button like 'I agree' or 'Accept all' on the consent dialog if present");
        if (buttons && buttons.length > 0) {
          await this.addHumanDelay(400, 900);
          await p.act(buttons[0]);
          await this.addHumanDelay(500, 1100);
        }
      } catch {}
      try { await p.act("wait for the page to fully load"); } catch {}
      try { await p.act("scroll down slightly"); } catch {}
      await this.updatePageContext(p);
      const mem = getAgentMemory();
      mem.add({ transcript: 'Initialized session at Google', url: store.lastKnownUrl || undefined, resultSummary: 'Ready on Google homepage' });
    } catch (e) {
      console.warn("ensureGoogleHome failed:", (e as any)?.message);
    }
  },

  async updatePageContext(page?: any): Promise<void> {
    const p = page || (await this.getPage());
    try {
      const info = await p.extract({
        instruction: "Return the current page URL and title from the browser",
        schema: z.object({ url: z.string().describe("current URL"), title: z.string().describe("page title") }),
        domSettleTimeoutMs: 8000,
      });
      if (info && typeof info.url === "string") store.lastKnownUrl = info.url;
      if (info && typeof info.title === "string") store.lastKnownTitle = info.title;
    } catch {}
  },

  async getCurrentContext(): Promise<{ url?: string | null; title?: string | null }> {
    if (!store.lastKnownUrl || !store.lastKnownTitle) {
      try { await this.updatePageContext(); } catch {}
    }
    return { url: store.lastKnownUrl, title: store.lastKnownTitle };
  },

  async getSessionViewUrl(): Promise<string> {
    await initialize();
    const liveViewUrl = (store.session as any)?.debugUrl;
    if (typeof liveViewUrl === "string" && liveViewUrl.length > 0) {
      return liveViewUrl;
    }
    throw new Error("Live view URL is not available on the Stagehand session.");
  },
};

// Backwards-compatibility wrapper for existing routes expecting BrowserBase API
export const BrowserBase = {
  async getSessionId(): Promise<string> {
    await initialize();
    return "stagehand-session";
  },

  async executeAction(_sessionId: string, action: BrowserAction): Promise<string> {
    return Browser.executeAction(action);
  },

  async getSessionViewUrl(): Promise<string> {
    return Browser.getSessionViewUrl();
  },
};