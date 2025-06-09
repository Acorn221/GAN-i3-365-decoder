/**
 * AES-128 encryption and decryption functions using Web Crypto API
 * This is a modern, secure implementation that replaces the custom AES implementation
 */

/**
 * Encrypts data using AES-GCM with a random initialization vector (IV)
 * @param key - The encryption key (must be 16 bytes for AES-128)
 * @param data - The data to encrypt
 * @returns A Uint8Array containing the IV followed by the encrypted data
 */
export async function encrypt(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  // Create a random 16-byte initialization vector
  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);

  // Import the raw key for use with AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    false,
    ['encrypt'],
  );

  // Encrypt the data
  const cipher = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    cryptoKey,
    data,
  );

  // Combine the IV and encrypted data into a single array
  const encrypted = new Uint8Array(iv.byteLength + cipher.byteLength);
  encrypted.set(iv);
  encrypted.set(new Uint8Array(cipher), iv.byteLength);

  return encrypted;
}

/**
 * Encrypts a string using AES-GCM
 * @param key - The encryption key (must be 16 bytes for AES-128)
 * @param data - The string to encrypt
 * @returns A Uint8Array containing the IV followed by the encrypted data
 */
export async function encryptString(key: Uint8Array, data: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(data);
  return encrypt(key, encoded);
}

/**
 * Decrypts data that was encrypted using the encrypt function
 * @param key - The encryption key (must be 16 bytes for AES-128)
 * @param encrypted - The encrypted data (IV + ciphertext)
 * @returns The decrypted data
 * @throws Error if the data is invalid or decryption fails
 */
export async function decrypt(key: Uint8Array, encrypted: Uint8Array): Promise<Uint8Array> {
  // Ensure we have at least enough data for the IV
  if (encrypted.length < 16) {
    throw new Error('Invalid data: too short to contain IV');
  }

  // Import the raw key for use with AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    false,
    ['decrypt'],
  );

  // Extract the IV from the first 16 bytes
  const iv = encrypted.slice(0, 16);

  // Decrypt the data
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      cryptoKey,
      encrypted.slice(16),
    );

    return new Uint8Array(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Decrypts encrypted data to a string
 * @param key - The encryption key (must be 16 bytes for AES-128)
 * @param data - The encrypted data (IV + ciphertext)
 * @returns The decrypted string
 * @throws Error if the data is invalid or decryption fails
 */
export async function decryptToString(key: Uint8Array, data: Uint8Array): Promise<string> {
  const decrypted = await decrypt(key, data);
  return new TextDecoder().decode(decrypted);
}

/**
 * Creates a key from a string using SHA-256 and truncating to 16 bytes for AES-128
 * @param keyString - The string to derive the key from
 * @returns A 16-byte key suitable for AES-128
 */
export async function createKeyFromString(keyString: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);

  // Hash the key string using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);

  // Take the first 16 bytes (128 bits) for AES-128
  return new Uint8Array(hashBuffer).slice(0, 16);
}

/**
 * Generates a random AES-128 key (16 bytes)
 * @returns A random 16-byte key suitable for AES-128
 */
export function generateRandomKey(): Uint8Array {
  const key = new Uint8Array(16);
  crypto.getRandomValues(key);
  return key;
}
