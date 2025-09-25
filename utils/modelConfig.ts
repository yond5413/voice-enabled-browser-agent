// Model configuration with fallback support
export interface ModelConfig {
  name: string;
  provider: 'openrouter' | 'openai' | 'anthropic';
  displayName: string;
  maxRetries?: number;
}

// Ordered list of models to try (best to worst in terms of quality/reliability)
export const FALLBACK_MODELS: ModelConfig[] = [
  {
    name: 'deepseek/deepseek-chat-v3.1:free',
    provider: 'openrouter',
    displayName: 'DeepSeek Chat v3.1 (Free)',
    maxRetries: 2
  },
  {
    name: 'openai/gpt-oss-20b:free',
    provider: 'openrouter',
    displayName: 'GPT-OSS 20B (Free)', 
    maxRetries: 2
  },
  {
    name: 'z-ai/glm-4.5-air:free',
    provider: 'openrouter', 
    displayName: 'GLM-4.5-AIR (Free)',
    maxRetries: 2
  },
  
  {
    name: 'qwen/qwen3-235b-a22b:free',
    provider: 'openrouter',
    displayName: 'Qwen3-235B-A22B (Free)',
    maxRetries: 2
  },
  {
    name: 'google/gemma-3-27b-it:free',
    provider: 'openrouter',
    displayName: 'Gemma 3 27B IT (Free)',
    maxRetries: 2
  }
];

export interface ModelAttemptResult {
  success: boolean;
  modelUsed?: ModelConfig;
  error?: Error;
  isRateLimited?: boolean;
  shouldRetry?: boolean;
}

export class ModelFallbackManager {
  private currentModelIndex: number = 0;
  private attemptCounts: Map<string, number> = new Map();
  
  constructor(private models: ModelConfig[] = FALLBACK_MODELS) {}

  getCurrentModel(): ModelConfig {
    return this.models[this.currentModelIndex];
  }

  async tryWithFallback<T>(
    operation: (model: ModelConfig) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    // Try each model in sequence
    for (let modelIndex = this.currentModelIndex; modelIndex < this.models.length; modelIndex++) {
      const model = this.models[modelIndex];
      const attemptKey = model.name;
      const currentAttempts = this.attemptCounts.get(attemptKey) || 0;
      const maxRetries = model.maxRetries || 1;

      // Skip if we've exceeded retries for this model
      if (currentAttempts >= maxRetries) {
        console.log(`Skipping ${model.displayName} - max retries (${maxRetries}) exceeded`);
        continue;
      }

      try {
        console.log(`Attempting with model: ${model.displayName} (attempt ${currentAttempts + 1}/${maxRetries})`);
        
        // Increment attempt count
        this.attemptCounts.set(attemptKey, currentAttempts + 1);
        
        const result = await operation(model);
        
        // Success! Update current model and reset attempt counts for successful model
        this.currentModelIndex = modelIndex;
        this.attemptCounts.set(attemptKey, 0);
        console.log(`✅ Success with model: ${model.displayName}`);
        
        return result;
        
      } catch (error: any) {
        lastError = error;
        const isRateLimited = this.isRateLimitError(error);
        const isTemporaryError = isRateLimited || this.isTemporaryError(error);

        console.error(`❌ ${model.displayName} failed:`, error.message);

        if (isRateLimited) {
          console.log(`🚫 Rate limited: ${model.displayName}`);
          // For rate limits, mark this model as temporarily unavailable
          this.attemptCounts.set(attemptKey, maxRetries);
        }

        if (!isTemporaryError) {
          // For non-temporary errors, don't retry this model
          this.attemptCounts.set(attemptKey, maxRetries);
        }

        // If this was the last attempt for this model, continue to next model
        if ((this.attemptCounts.get(attemptKey) || 0) >= maxRetries) {
          console.log(`⏭️  Moving to next model after ${model.displayName}`);
          continue;
        }

        // Otherwise, retry with same model
        modelIndex--; // Decrement to retry same model
      }
    }

    // If we've tried all models, reset and throw the last error
    console.error('🔄 All models failed, resetting attempt counts...');
    this.resetAttemptCounts();
    throw lastError || new Error('All fallback models failed');
  }

  private isRateLimitError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.code;
    
    return status === 429 || 
           message.includes('rate limit') || 
           message.includes('too many requests') ||
           message.includes('rate-limited') ||
           message.includes('429');
  }

  private isTemporaryError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.code;
    
    return status >= 500 || // Server errors
           message.includes('timeout') ||
           message.includes('connection') ||
           message.includes('network') ||
           this.isRateLimitError(error);
  }

  resetAttemptCounts(): void {
    this.attemptCounts.clear();
    this.currentModelIndex = 0;
  }

  getStatus(): { currentModel: ModelConfig; attempts: Record<string, number> } {
    return {
      currentModel: this.getCurrentModel(),
      attempts: Object.fromEntries(this.attemptCounts.entries())
    };
  }
}

// Global instance
export const globalModelFallback = new ModelFallbackManager();
