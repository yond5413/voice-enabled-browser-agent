// In-memory artifacts store per session

export type ArtifactType = 'intent' | 'action' | 'screenshot' | 'extraction' | 'log'

export interface ArtifactEntry {
  id: string
  type: ArtifactType
  label?: string
  timestamp: string
  data?: any
}

type ArtifactStore = Record<string, ArtifactEntry[]>

declare global {
  // eslint-disable-next-line no-var
  var __artifactsStore__: ArtifactStore | undefined
}

const artifacts: ArtifactStore = (globalThis as any).__artifactsStore__ || ((globalThis as any).__artifactsStore__ = {})

export function addArtifact (sessionId: string, entry: Omit<ArtifactEntry, 'id' | 'timestamp'> & { id?: string, timestamp?: string }): ArtifactEntry {
  if (!artifacts[sessionId]) artifacts[sessionId] = []
  const full: ArtifactEntry = {
    id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: entry.type,
    label: entry.label,
    data: entry.data,
    timestamp: entry.timestamp || new Date().toISOString()
  }
  artifacts[sessionId].push(full)
  return full
}

export function getArtifacts (sessionId: string): ArtifactEntry[] {
  return artifacts[sessionId] || []
}

export function clearArtifacts (sessionId: string): void {
  delete artifacts[sessionId]
}


