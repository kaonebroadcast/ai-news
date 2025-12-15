// List of Gemini API keys to rotate through
// export const GEMINI_API_KEYS = [
//   'AIzaSyBrYE94vZ2HQ-BSqE5uUzOiJTpclGa9E3k',  // Your primary key
//   // Add more keys here as needed
//   // 'YOUR_SECOND_KEY',
//   // 'YOUR_THIRD_KEY',
// ];

// Helper to dynamically get all GEMINI_API_KEYS from env as string[]
const getGeminiApiKeys = (): string[] => {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const raw = env.GEMINI_API_KEYS;

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.error("Invalid GEMINI_API_KEYS format. Must be a JSON array of strings.");
      return [];
    }

    return parsed
      .filter((key): key is string => typeof key === "string")
      .map((key: string) => key.trim())
      .filter((key: string) => key.length > 0);
  } catch (err) {
    console.error("Invalid GEMINI_API_KEYS JSON. Must be a JSON array of strings.", err);
    return [];
  }
};

export const GEMINI_API_KEYS = getGeminiApiKeys();


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
  throw new Error(
    'No Gemini API keys provided. Please set GEMINI_API_KEYS as a JSON array in your environment, e.g. GEMINI_API_KEYS=["key1","key2"].'
  );
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
