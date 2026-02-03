/**
 * API Key encryption utilities using AES-256-GCM.
 * Uses BETTER_AUTH_SECRET as the source for key derivation.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT = "voice-dictation-api-keys";

/**
 * Derive a 256-bit encryption key from BETTER_AUTH_SECRET using scrypt.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for encryption");
  }
  return scryptSync(secret, SALT, 32);
}

/**
 * Encrypt a plaintext string.
 * Returns format: iv:ciphertext:authTag (all base64 encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    encrypted.toString("base64"),
    authTag.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a ciphertext string.
 * Expects format: iv:ciphertext:authTag (all base64 encoded)
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivB64, encryptedB64, authTagB64] = ciphertext.split(":");

  if (!ivB64 || !encryptedB64 || !authTagB64) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted) + decipher.final("utf8");
}

/**
 * Generate a masked hint from an API key.
 * Shows only the last 4 characters, e.g., "****xyz1"
 */
export function generateKeyHint(apiKey: string): string {
  if (apiKey.length <= 4) {
    return "****";
  }
  return "****" + apiKey.slice(-4);
}
