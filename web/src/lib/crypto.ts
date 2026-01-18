/**
 * Web Crypto API utilities for AES-256-GCM encryption/decryption
 * 
 * AES-GCM provides authenticated encryption:
 * - Confidentiality: Data is encrypted
 * - Integrity: Tampering is detected
 * - Authentication: Only key holder can decrypt
 */

// Generate a random 256-bit key and return as hex string
export async function generateKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32))
  return arrayToHex(key)
}

// Encrypt data using AES-256-GCM
export async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const key = await importKey(keyHex)
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  
  return arrayToBase64(combined)
}

// Decrypt data using AES-256-GCM
export async function decrypt(encryptedBase64: string, keyHex: string): Promise<string> {
  const key = await importKey(keyHex)
  const combined = base64ToArray(encryptedBase64)
  
  // Extract IV (first 12 bytes) and ciphertext
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

// Import hex key as CryptoKey
async function importKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = hexToArray(keyHex)
  return crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

// Utility: Uint8Array to hex string
function arrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Utility: hex string to Uint8Array
function hexToArray(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

// Utility: Uint8Array to base64 string
function arrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
}

// Utility: base64 string to Uint8Array
function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
