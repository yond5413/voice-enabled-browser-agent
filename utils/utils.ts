import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// --- Lightweight in-memory context (mem0-like) ---
type MemoryItem<T> = T & { _ts: number }

export function createMemoryStore<T> (limit: number = 10) {
  const items: MemoryItem<T>[] = []

  function add (item: T): void {
    const entry: MemoryItem<T> = { ...item, _ts: Date.now() }
    items.push(entry)
    while (items.length > limit) items.shift()
  }

  function getRecent (count: number = limit): T[] {
    return items.slice(-count).map(({ _ts, ...rest }) => rest as T)
  }

  function clear (): void {
    items.length = 0
  }

  return { add, getRecent, clear }
}

// Domain-specific memory entries
type IntentMemory = {
  transcript: string
  parsedAction?: any
  resultSummary?: string
  url?: string
}

declare global {
  // eslint-disable-next-line no-var
  var __agentMemory__: ReturnType<typeof createMemoryStore<IntentMemory>> | undefined
}

export function getAgentMemory () {
  if (!(globalThis as any).__agentMemory__) {
    ;(globalThis as any).__agentMemory__ = createMemoryStore<IntentMemory>(15)
  }
  return (globalThis as any).__agentMemory__ as ReturnType<typeof createMemoryStore<IntentMemory>>
}

export function summarizeForPrompt (entries: IntentMemory[], maxChars: number = 800): string {
  const lines = entries.map((e, idx) => {
    const parts = [] as string[]
    parts.push(`#${idx + 1}`)
    parts.push(`said: "${e.transcript}"`)
    if (e.parsedAction) parts.push(`action: ${JSON.stringify(e.parsedAction)}`)
    if (e.resultSummary) parts.push(`result: ${e.resultSummary}`)
    if (e.url) parts.push(`url: ${e.url}`)
    return parts.join(' | ')
  })
  let out = ''
  for (let i = Math.max(0, lines.length - 1); i >= 0; i--) {
    const candidate = (out ? lines[i] + '\n' + out : lines[i])
    if (candidate.length > maxChars) break
    out = candidate
  }
  return out
}