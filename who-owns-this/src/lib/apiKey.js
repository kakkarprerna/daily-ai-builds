// Reads/writes the visitor's own Anthropic key in their browser only.
// Never sent anywhere except as a header on their own /api/diagnose calls.

const STORAGE_KEY = 'who-owns-this:anthropic-api-key'

export function getStoredKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function setStoredKey(key) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable (private browsing, etc.) — fail quietly
  }
}
