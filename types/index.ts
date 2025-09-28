// Core types for Project Aria

// Represents an action that directly manipulates the browser
export interface BrowserAction {
  action: 'navigate' | 'click' | 'type' | 'extract' | 'press';
  target: string;
  value?: string;
}

// Represents an action where the agent needs to ask a clarifying question
export interface ClarifyAction {
  action: 'clarify';
  question: string;
}

// A union of all possible actions the agent can decide on
export type AgentAction = BrowserAction | ClarifyAction;

// A plan of multiple actions to fulfill a single intent
export interface ActionPlan {
  actions: BrowserAction[];
}

export type AgentDecision = AgentAction | ActionPlan;

export interface ActionLog {
  id: string;
  timestamp: string;
  command: string;
  status: 'processing' | 'success' | 'error';
  result?: string;
  action?: AgentAction;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error?: string;
}

export interface DeepgramConfig {
  apiKey: string;
  model: string;
  punctuate: boolean;
  diarize: boolean;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}