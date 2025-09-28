// Simple in-memory session store shared across API routes
// Stores timestamped history for each sessionId

export type SessionRole = 'user' | 'agent'

export interface SessionHistoryItem {
  role: SessionRole
  content: string
  timestamp: string
}

export interface SessionContext {
  history: SessionHistoryItem[]
}

type SessionStore = Record<string, SessionContext>

declare global {
  // eslint-disable-next-line no-var
  var __sessionStore__: SessionStore | undefined
}

const store: SessionStore = (globalThis as any).__sessionStore__ || ((globalThis as any).__sessionStore__ = {})

export function getSessionContext (sessionId: string): SessionContext {
  if (!store[sessionId]) store[sessionId] = { history: [] }
  return store[sessionId]
}

export function appendHistory (
  sessionId: string,
  role: SessionRole,
  content: string,
  timestamp?: string
): SessionHistoryItem {
  const ctx = getSessionContext(sessionId)
  const entry: SessionHistoryItem = {
    role,
    content,
    timestamp: timestamp || new Date().toISOString()
  }
  ctx.history.push(entry)
  return entry
}

export function getSessionHistory (sessionId: string): SessionHistoryItem[] {
  return getSessionContext(sessionId).history
}

export function clearSession (sessionId: string): void {
  delete store[sessionId]
}


