/**
 * Encryption library — Phase 1 stub.
 *
 * Public API surface (runs client-side)
 *
 * Key design:
 *   masterPassword + salt --Argon2id--> masterKey (32 bytes)
 *     --HKDF("auth")-->    authKey        (sent to server on login)
 *     --HKDF("enc")-->     encryptionKey  (never leaves the client)
 */

import type { VaultItemSecret } from "@app/shared";

/** Argon2id parameters */
export interface KdfParams {
  version: 1; // Manage the version of the KDF parameters.
  algorithm: "argon2id";
  memoryKiB: number; // Memory cost in KiB (e.g. 65536 = 64 MiB).
  iterations: number; // Time cost (number of passes).
  parallelism: number;
}
export const DEFAULT_KDF_PARAMS: KdfParams = {
  version: 1,
  algorithm: "argon2id",
  memoryKiB: 65536,
  iterations: 3,
  parallelism: 1,
};

/** Decoded binary form of an encrypted payload. */
export interface EncryptedPayload {
  version: number; // Payload format version
  nonce: Uint8Array<ArrayBuffer>; // AES-GCM nonce, 12 bytes, unique per encryption.
  ciphertext: Uint8Array<ArrayBuffer>; // Ciphertext including the GCM auth tag (as produced by Web Crypto).
}

export const PAYLOAD_VERSION = 1;
export const NONCE_LENGTH = 12;

/** Error thrown by Phase 1 stub functions. */
class NotImplementedError extends Error {
  constructor(functionName: string) {
    super(`${functionName} is a Phase 1 stub — implemented in Phase 2`);
  }
}

/**
 * Derives the key sent to the server as the login credential.
 * The server treats it as an opaque password and hashes it again.
 */
export async function deriveAuthKey(
  _masterPassword: string,
  _salt: Uint8Array,
  _params: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<Uint8Array<ArrayBuffer>> {
  throw new NotImplementedError("deriveAuthKey");
}

/**
 * Derives the vault encryption key.
 * Returned as a non-extractable CryptoKey so it cannot be serialized or accidentally sent anywhere.
 */
export async function deriveEncryptionKey(
  _masterPassword: string,
  _salt: Uint8Array,
  _params: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<CryptoKey> {
  throw new NotImplementedError("deriveEncryptionKey");
}

/** Generates a fresh random per-user salt (registration time). */
export function generateSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(16));
}

/** Generates a fresh AES-GCM nonce. Must be unique per encryption. */
export function generateNonce(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
}

/** Encrypts the secret fields of a vault item into an encoded payload string. */
export async function encryptVaultItem(
  _item: VaultItemSecret,
  _key: CryptoKey,
): Promise<string> {
  throw new NotImplementedError("encryptVaultItem");
}

/** Decrypts an encoded payload string back into the secret fields. */
export async function decryptVaultItem(
  _payload: string,
  _key: CryptoKey,
): Promise<VaultItemSecret> {
  throw new NotImplementedError("decryptVaultItem");
}

/** Encodes version || nonce || ciphertext as base64 for storage/transport. */
export function encodeEncryptedPayload(_payload: EncryptedPayload): string {
  throw new NotImplementedError("encodeEncryptedPayload");
}

/** Decodes a base64 payload string back into its binary parts. */
export function decodeEncryptedPayload(_encoded: string): EncryptedPayload {
  throw new NotImplementedError("decodeEncryptedPayload");
}

// ---- Phase 3: password quality helpers ----

export interface PasswordGenerationOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordGenerationOptions = {
  length: 20,
  includeUppercase: true,
  includeLowercase: true,
  includeDigits: true,
  includeSymbols: true,
};

/** Generates a random password from the selected character classes (CSPRNG-backed). */
export function generateSuggestedPassword(
  _options: PasswordGenerationOptions = DEFAULT_PASSWORD_OPTIONS,
): string {
  throw new NotImplementedError("generateSuggestedPassword");
}

/** True if the password appears in the bundled common-password list. Runs client-side only. */
export function isCommonPassword(_password: string): boolean {
  throw new NotImplementedError("isCommonPassword");
}

/**
 * True if the password matches one already stored in the vault.
 * Takes decrypted items because comparison happens client-side only.
 */
export function isReusedPassword(
  _password: string,
  _decryptedItems: readonly VaultItemSecret[],
): boolean {
  throw new NotImplementedError("isReusedPassword");
}
