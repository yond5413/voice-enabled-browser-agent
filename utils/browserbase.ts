import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { BrowserAction } from "@/types";
import { globalModelFallback, ModelConfig } from "./modelConfig";
import { sleep, getAgentMemory } from "./utils";
import { addArtifact } from "./artifactsStore";

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
const shouldUseProxiesByDefault = process.env.BROWSERBASE_USE_PROXIES
  ? process.env.BROWSERBASE_USE_PROXIES === "true"
  : true; // default to proxies enabled (plan supports proxies)
const preferredRegion = process.env.BROWSERBASE_REGION;
const keepAliveEnabled = process.env.BROWSERBASE_KEEP_ALIVE
  ? process.env.BROWSERBASE_KEEP_ALIVE === "true"
  : true; // default to keepAlive enabled for longer sessions
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

function createStagehandForModel(
  model: ModelConfig,
  useProxies: boolean,
  opts?: { omitRegion?: boolean; keepAlive?: boolean }
): Stagehand {
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
      blockAds: true,
      os: resolvedOs,
      viewport: {
        width: 1920,
        height: 1080,
      },
    },
  };
  if (preferredRegion && !opts?.omitRegion) sessionParams.region = preferredRegion;
  if (typeof opts?.keepAlive === 'boolean') {
    sessionParams.keepAlive = opts.keepAlive;
  } else if (keepAliveEnabled) {
    sessionParams.keepAlive = true;
  }

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
    domSettleTimeoutMs: 45000,
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

  if (!store.stagehand) {
    throw new Error("Stagehand not initialized. Call initialize() first.");
  }

  return store.stagehand as Stagehand;
}

async function ensureStagehandWithFallback(): Promise<void> {
  await globalModelFallback.tryWithFallback(async (model) => {
    // Build with default proxies setting
    let stagehand = createStagehandForModel(model, shouldUseProxiesByDefault);

    try {
      // Retry init multiple times for transient CDP/connect issues with exponential backoff
      let lastErr: any = null;
      let session: any = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          session = await stagehand.init();
          break;
        } catch (e: any) {
          lastErr = e;
          const msg = e?.message || '';
          // Adjust strategy based on failure type/attempt
          const isCdpOrTimeout = /connectOverCDP/i.test(msg) || /Timeout/i.test(msg);
          const is402 = msg.includes('402') || msg.toLowerCase().includes('proxies are not included in the free plan');
          if (shouldUseProxiesByDefault && (is402 || isCdpOrTimeout)) {
            if (attempt === 1) {
              console.warn(`Init attempt ${attempt} failed (${msg}). Retrying without proxies...`);
              stagehand = createStagehandForModel(model, false);
            } else if (attempt === 2) {
              console.warn(`Init attempt ${attempt} failed (${msg}). Retrying without proxies and omitting region...`);
              stagehand = createStagehandForModel(model, false, { omitRegion: true });
            } else if (attempt === 3) {
              console.warn(`Init attempt ${attempt} failed (${msg}). Retrying without proxies, no region, keepAlive=false...`);
              stagehand = createStagehandForModel(model, false, { omitRegion: true, keepAlive: false });
            } else {
              console.warn(`Init attempt ${attempt} failed (${msg}). Retrying with minimal defaults...`);
              stagehand = createStagehandForModel(model, false, { omitRegion: true, keepAlive: false });
            }
          } else {
            console.warn(`Init attempt ${attempt} failed (${msg}). Retrying...`);
          }
          await sleep(800 * attempt);
        }
      }
      if (!session) throw lastErr || new Error('Failed to initialize Stagehand');
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
    try {
      if (typeof (page as any).setDefaultNavigationTimeout === 'function') {
        (page as any).setDefaultNavigationTimeout(60000);
      }
      if (typeof (page as any).setDefaultTimeout === 'function') {
        (page as any).setDefaultTimeout(60000);
      }
    } catch {}
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

  async executeAction(action: BrowserAction & { sessionId?: string }): Promise<string> {
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
                
                // Add delay and optionally submit when it's a search field
                await this.addHumanDelay(500, 1200);
                if (/search/i.test(String(action.target))) {
                  try { await page.act("press Enter to submit the search"); } catch {}
                  await this.addHumanDelay(400, 1000);
                  try {
                    const buttons = await page.observe("Find the search submit button or magnifying glass icon to run the search");
                    if (buttons && buttons.length > 0) {
                      await page.act(buttons[0]);
                    }
                  } catch {}
                }
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
            if (/search/i.test(String(action.target))) {
              try { await page.act("press Enter to submit the search"); } catch {}
            }
            return `Typed "${action.value}" in "${action.target}"`;

          case "press":
            try {
              const key = String(action.target || '').trim();
              if (!key) throw new Error('No key provided to press');
              // Prefer natural instruction to trigger correct element context
              await page.act(`press the ${key} key`);
              return `Pressed ${key}`;
            } catch (e) {
              // minimal fallback
              await page.act("press Enter");
              return `Pressed ${String(action.target || 'Enter')}`;
            }
            
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
            // Store extraction as artifact
            try { if (action.sessionId) addArtifact(action.sessionId, { type: 'extraction', label: action.target, data }); } catch {}
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
            //await this.addHumanDelay(1200, 2200);
            await page.act("scroll up and down slowly");
            //await this.addHumanDelay(1000, 1800);
          } catch {}
        }
        throw error;
      }
    });
  },

  async captureScreenshot(sessionId?: string, label?: string): Promise<void> {
    try {
      const page = await this.getPage();
      // Use Playwright's screenshot from Stagehand page
      const buffer = await (page as any).screenshot({ fullPage: true });
      const b64 = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
      if (sessionId) addArtifact(sessionId, { type: 'screenshot', label: label || 'Screenshot', data: { image: b64 } });
    } catch (e) {
      console.warn('Screenshot capture failed:', (e as any)?.message);
    }
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
      try {
        // Prefer plain Google with English locale; wait for DOM readiness
        await p.goto("https://www.google.com/?hl=en", { waitUntil: 'domcontentloaded', timeout: 45000 });
      } catch {
        // Fallback if NCR path fails in some regions
        try {
          await p.goto("https://www.google.com/ncr", { waitUntil: 'domcontentloaded', timeout: 45000 });
        } catch {
          await p.goto("https://www.google.com", { waitUntil: 'domcontentloaded', timeout: 45000 });
        }
      }
      await this.addHumanDelay(600, 1200);
      // Handle consent if present
      try {
        const buttons = await p.observe("Find a button like 'I agree' or 'Accept all' on the consent dialog if present");
        if (buttons && buttons.length > 0) {
          //await this.addHumanDelay(400, 900);
          await p.act(buttons[0]);
          //await this.addHumanDelay(500, 1100);
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

  async getTextualSnapshot(): Promise<string> {
    const p = await this.getPage();
    try {
      const data = await p.extract({
        instruction:
          "Provide a compact textual snapshot of the visible page to help a non-vision model understand layout and intent. Include main purpose, key sections, and primary actions. Avoid code, selectors, or long lists.",
        schema: z.object({
          url: z.string().optional(),
          title: z.string().optional(),
          mainPurpose: z
            .string()
            .describe("A one-sentence description of what this page enables the user to do"),
          keySections: z
            .array(z.string())
            .max(6)
            .describe("Up to 6 section titles or short descriptions in reading order"),
          primaryActions: z
            .array(z.string())
            .max(6)
            .describe("Up to 6 prominent buttons or links users are expected to click"),
        }),
        domSettleTimeoutMs: 8000,
      });

      const lines: string[] = [];
      const header = [data?.title, data?.url].filter(Boolean).join(" | ");
      if (header) lines.push(header);
      if (data?.mainPurpose) lines.push(`Purpose: ${data.mainPurpose}`);
      if (data?.keySections?.length) lines.push(`Sections: ${data.keySections.join(" • ")}`);
      if (data?.primaryActions?.length) lines.push(`Primary actions: ${data.primaryActions.join(" • ")}`);
      const out = lines.join("\n");
      return typeof out === "string" ? out : "";
    } catch {
      return "";
    }
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