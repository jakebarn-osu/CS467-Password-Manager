/**
 * Shared type definitions for vault records.
 *
 * This will be imported by frontend, api, and this crypto package.
 */

/** Response of GET /api/v1/auth/salt?email={email}. */
export interface SaltResponse {
  userSalt: string; // Base64-encoded per-user salt, generated client-side at registration.
}

/**
 * A decrypted vault entry (exists only in memory on the client).
 * Never sent to or stored on the server in this form.
 */
export interface VaultItem {
  id: string;
  siteName: string;
  siteUrl?: string;
  username: string;
  password: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields of VaultItem that are encrypted into the payload (id/timestamps stay outside). */
export type VaultItemSecret = Omit<VaultItem, "id" | "createdAt" | "updatedAt">;

/**
 * What the server stores and the vault API returns.
 * The server never sees plaintext or the encryption key.
 */
export interface EncryptedVaultItem {
  id: string;
  userId: string;
  payload: string; // Encrypted payload (base64). Produced and consumed only by crypto package.
  createdAt: string;
  updatedAt: string;
}
