# Voice-Enabled Browser Agent: Development Plan

This document outlines the architectural plan and phased development approach for creating a voice-enabled browser agent using BrowserBase, Stagehand, and a Next.js application.

## 1. Core Architecture

The system consists of three primary components:

1.  **Frontend (Next.js/React):** Handles user interaction, including voice input (STT) and displaying the remote browser session within an `iframe`.
2.  **Backend (Next.js API Routes):** Acts as the central controller. It manages the browser session, interprets user commands, and directs the browser via Stagehand actions.
3.  **BrowserBase:** A remote, headless browser service that we control programmatically via its API.

### Architectural Flow

```
[User Voice] -> [STT Service] -> [Frontend] -> [Backend API] -> [Stagehand] -> [BrowserBase API] -> [Remote Browser]
                                    ^                                                                   |
                                    |____________________[iframe View]__________________________________|
```

---

## 2. Development Plan: Phased Approach

### Phase 1: Establish the Backend & Browser Session

**Goal:** Create and manage a persistent browser session that the frontend can view.

1.  **BrowserBase API Wrapper (`utils/browserbase.ts`):**
    *   Create a dedicated module to abstract all BrowserBase API interactions.
    *   **Functions:** `getSession(sessionId?)`, `getSessionViewUrl(sessionId)`, `executeAction(sessionId, action)`.

2.  **Session API Endpoint (`app/api/agent/session/route.ts`):**
    *   Create a `GET` endpoint.
    *   This endpoint will use the API wrapper to get or create a session.
    *   It will return the `sessionId` and `sessionViewUrl` to the frontend.

### Phase 2: Frontend Iframe Integration

**Goal:** Display the remote browser session in the user interface.

1.  **BrowserView Component (`components/BrowserView.tsx`):**
    *   A React component that renders an `iframe`.
    *   The `src` of the `iframe` will be the `sessionViewUrl` from the backend.

2.  **Page Integration (`app/page.tsx`):**
    *   On page load (`useEffect`), call the `/api/agent/session` endpoint.
    *   Store the `sessionViewUrl` in component state.
    *   Render the `<BrowserView />` component with the URL.

### Phase 3: The "Agent" Logic - Connecting Voice to Action

**Goal:** Translate user voice commands into browser actions.

1.  **Action API Endpoint (`app/api/agent/action/route.ts`):**
    *   Create a `POST` endpoint that accepts a structured JSON command.
    *   This endpoint will call the appropriate function in `stagehandActions.ts`.

2.  **Enhance Stagehand (`utils/stagehandActions.ts`):**
    *   This module will translate abstract commands (e.g., "click button") into specific BrowserBase API calls.
    *   It will use the `browserbase.ts` wrapper to execute these commands.

3.  **LLM Intent Parsing (`utils/intentParser.ts`):**
    *   This module will take the raw text from the STT.
    *   It will use an LLM (via OpenRouter) to convert the text into a structured JSON action.
    *   **Example:** "Go to Google" -> `{ "action": "navigate", "url": "https://google.com" }`.

4.  **Frontend Logic:**
    *   After STT, send the text to the `intentParser`.
    *   Take the resulting JSON and `POST` it to the `/api/agent/action` endpoint.

---

## 3. Key Challenges & Considerations

*   **Element Identification:** The primary challenge is mapping natural language ("the blue button") to specific DOM elements. We will start with text-based searches and can evolve to use multimodal LLMs that can read the DOM/screenshot.
*   **LLM Integration (Flexibility):** We will use OpenRouter to access a variety of LLMs (including free ones) via its OpenAI-compatible API. This avoids vendor lock-in and reduces cost. The implementation will involve setting the `baseURL` in the OpenAI client to point to OpenRouter.
*   **State Management:** The agent needs to provide feedback (e.g., "loading," "action failed"). The backend APIs should return clear status updates to the frontend.
*   **Security:** API keys and other secrets must be stored in `.env.local` and only accessed on the backend. They should never be exposed to the client.
