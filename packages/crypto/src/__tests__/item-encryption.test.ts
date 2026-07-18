/**
 * Round-trip and negative tests for encryptVaultItem / decryptVaultItem.
 * Most tests use a raw AES-GCM key so they don't pay the Argon2 cost; one
 * end-to-end test derives the key from a master password.
 */
import { describe, expect, it } from "vitest";

import {
  base64ToBytes,
  bytesToBase64,
  decryptVaultItem,
  deriveEncryptionKey,
  encodeEncryptedPayload,
  encryptVaultItem,
  generateNonce,
  generateSalt,
  PAYLOAD_VERSION,
  type KdfParams,
  type VaultItemSecret,
} from "../crypto.js";

const ITEM: VaultItemSecret = {
  siteName: "example.com",
  siteUrl: "https://example.com/login",
  username: "mina",
  password: "correct horse battery staple",
  notes: "日本語のメモ / emoji 🔐",
};

const FAST_KDF_PARAMS: KdfParams = {
  version: 1,
  algorithm: "argon2id",
  memoryKiB: 1024,
  iterations: 2,
  parallelism: 1,
};

/** A raw AES-GCM key, so the encrypt/decrypt tests don't pay the Argon2 cost. */
async function aesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

describe("encryptVaultItem / decryptVaultItem", () => {
  it("round-trips a vault item, including unicode fields", async () => {
    const key = await aesKey();
    const payload = await encryptVaultItem(ITEM, key);
    expect(typeof payload).toBe("string");
    await expect(decryptVaultItem(payload, key)).resolves.toEqual(ITEM);
  });

  it("produces a different payload every time (fresh nonce), all decryptable", async () => {
    const key = await aesKey();
    const p1 = await encryptVaultItem(ITEM, key);
    const p2 = await encryptVaultItem(ITEM, key);
    expect(p1).not.toEqual(p2);
    await expect(decryptVaultItem(p2, key)).resolves.toEqual(ITEM);
  });

  it("fails with a clear error on a tampered payload", async () => {
    const key = await aesKey();
    const payload = await encryptVaultItem(ITEM, key);
    const bytes = base64ToBytes(payload);
    bytes[bytes.length - 1]! ^= 0xff; // corrupt the last ciphertext byte
    await expect(decryptVaultItem(bytesToBase64(bytes), key)).rejects.toThrow(
      /wrong key or corrupted payload/,
    );
  });

  it("fails when decrypting with a different key", async () => {
    const payload = await encryptVaultItem(ITEM, await aesKey());
    await expect(decryptVaultItem(payload, await aesKey())).rejects.toThrow();
  });

  it("reports a clear error when decrypted data is not a vault item", async () => {
    const key = await aesKey();
    const nonce = generateNonce();
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: nonce },
        key,
        new TextEncoder().encode("this is not JSON"),
      ),
    );
    const payload = encodeEncryptedPayload({ version: PAYLOAD_VERSION, nonce, ciphertext });
    await expect(decryptVaultItem(payload, key)).rejects.toThrow(/not a valid vault item/);
  });

  it("round-trips end-to-end with a key derived from a master password", async () => {
    const salt = generateSalt();
    const encKey = await deriveEncryptionKey("master-pw", salt, FAST_KDF_PARAMS);
    const payload = await encryptVaultItem(ITEM, encKey);

    // Re-derive on the next login and decrypt.
    const encKeyAgain = await deriveEncryptionKey("master-pw", salt, FAST_KDF_PARAMS);
    await expect(decryptVaultItem(payload, encKeyAgain)).resolves.toEqual(ITEM);

    // A key from the wrong master password cannot decrypt.
    const wrongKey = await deriveEncryptionKey("wrong-pw", salt, FAST_KDF_PARAMS);
    await expect(decryptVaultItem(payload, wrongKey)).rejects.toThrow();
  });
});
