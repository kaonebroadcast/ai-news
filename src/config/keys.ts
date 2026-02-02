// List of Gemini API keys to rotate through
// Supports:
// - GEMINI_API_KEY (single key)
// - GEMINI_API_KEYS (comma-separated: "key1, key2, key3" or JSON array: '["key1","key2"]')
function getApiKeys(): string[] {
  // Try GEMINI_API_KEYS first (supports both comma-separated and JSON array format)
  const keysEnv = process.env.GEMINI_API_KEYS;
  if (keysEnv) {
    const trimmed = keysEnv.trim();
    
    // Check if it's a JSON array format
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed) as string[];
        if (Array.isArray(parsed)) {
          return parsed.filter(key => typeof key === 'string' && key.length > 0);
        }
      } catch (error) {
        console.warn('Failed to parse GEMINI_API_KEYS as JSON array, falling back to comma-separated format');
      }
    }
    
    // Fall back to comma-separated format (handles spaces after commas)
    return trimmed.split(',').map(key => key.trim()).filter(key => key.length > 0);
  }
  
  // Fall back to GEMINI_API_KEY (single key)
  const keyEnv = process.env.GEMINI_API_KEY;
  if (keyEnv) {
    return [keyEnv.trim()];
  }
  
  // If no environment variable is set, return empty array
  // The error will be thrown in the initialization check below
  return [];
}

export const GEMINI_API_KEYS = getApiKeys();


// Track the current key index and rate limit status
type KeyStatus = {
  key: string;
  lastUsed: number;
  rateLimited: boolean;
  rateLimitReset: number;
};

let keys: KeyStatus[] = [];

// Initialize keys array
if (GEMINI_API_KEYS.length === 0) {
  throw new Error('No Gemini API keys provided. Please set GEMINI_API_KEY or GEMINI_API_KEYS environment variable.');
}

// Initialize keys status
export function initializeKeys() {
  keys = GEMINI_API_KEYS.map(key => ({
    key,
    lastUsed: 0,
    rateLimited: false,
    rateLimitReset: 0,
  }));
}

// Get the next available API key
export function getNextKey(): string | null {
  // Check if any keys are available
  const now = Date.now();
  const availableKey = keys.find(k => !k.rateLimited || k.rateLimitReset <= now);
  
  if (!availableKey) {
    return null; // All keys are rate limited
  }

  // Update key status
  availableKey.lastUsed = now;
  
  return availableKey.key;
}

// Mark a key as rate limited
export function markKeyAsRateLimited(key: string, resetTimeInSeconds = 60) {
  const keyStatus = keys.find(k => k.key === key);
  if (keyStatus) {
    keyStatus.rateLimited = true;
    keyStatus.rateLimitReset = Date.now() + (resetTimeInSeconds * 1000);
    
    // Try to find the next available key
    const nextKey = getNextKey();
    if (nextKey) {
      console.log(`Switched to next available API key`);
    } else {
      console.warn('All API keys are currently rate limited');
    }
  }
}
