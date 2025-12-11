/**
 * List of Gemini API keys to rotate through
 * Keys are loaded from environment variables for security
 * 
 * Returns an array of API keys, similar to the original hardcoded array format:
 * export const GEMINI_API_KEYS = ['key1', 'key2', 'key3'];
 * 
 * You can provide keys in your .env file using any of these methods:
 * 
 * Method 1: JSON array format (most similar to code array)
 *   GEMINI_API_KEYS=["key1","key2","key3"]
 *   or
 *   GEMINI_API_KEYS=['key1','key2','key3']
 * 
 * Method 2: Comma-separated (recommended for multiple keys)
 *   GEMINI_API_KEYS=key1,key2,key3
 * 
 * Method 3: Numbered keys
 *   GEMINI_API_KEY_1=key1
 *   GEMINI_API_KEY_2=key2
 *   GEMINI_API_KEY_3=key3
 * 
 * Method 4: Single key
 *   GEMINI_API_KEY=your_single_key
 */
function loadApiKeys(): string[] {
  // Access environment variables via globalThis to avoid linter issues
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  
  const keys: string[] = [];
  
  // Method 1: JSON array format or comma-separated keys in GEMINI_API_KEYS
  const multipleKeys = env.GEMINI_API_KEYS;
  if (multipleKeys) {
    // Try to parse as JSON array first
    const trimmed = multipleKeys.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
        (trimmed.startsWith("['") && trimmed.endsWith("']"))) {
      try {
        // Replace single quotes with double quotes for JSON parsing
        const jsonString = trimmed.replace(/'/g, '"');
        const parsedKeys = JSON.parse(jsonString) as string[];
        if (Array.isArray(parsedKeys)) {
          const validKeys = parsedKeys
            .filter((key): key is string => typeof key === 'string' && key.length > 0)
            .map((key: string) => key.trim());
          keys.push(...validKeys);
        }
      } catch {
        // If JSON parsing fails, fall back to comma-separated
        const commaSeparatedKeys = multipleKeys
          .split(',')
          .map((key: string) => key.trim().replace(/^['"]|['"]$/g, '')) // Remove quotes if present
          .filter((key: string) => key.length > 0);
        keys.push(...commaSeparatedKeys);
      }
    } else {
      // Comma-separated format
      const commaSeparatedKeys = multipleKeys
        .split(',')
        .map((key: string) => key.trim())
        .filter((key: string) => key.length > 0);
      keys.push(...commaSeparatedKeys);
    }
  }
  
  // Method 2: Numbered keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
  let keyIndex = 1;
  while (true) {
    const numberedKey = env[`GEMINI_API_KEY_${keyIndex}`];
    if (numberedKey) {
      keys.push(numberedKey.trim());
      keyIndex++;
    } else {
      break;
    }
  }
  
  // Method 3: Single key in GEMINI_API_KEY (if no other keys found)
  if (keys.length === 0) {
    const singleKey = env.GEMINI_API_KEY;
    if (singleKey) {
      keys.push(singleKey.trim());
    }
  }
  
  return keys;
}

export const GEMINI_API_KEYS = loadApiKeys();

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
