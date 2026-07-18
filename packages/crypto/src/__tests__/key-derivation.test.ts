/**
 * Tests for the Phase 2 key-derivation functions.
 * Uses small Argon2 params so the suite stays fast; production params are
 * verified separately. Vault-item encryption lands in a later PR, so these
 * tests exercise the derived keys with the Web Crypto AES-GCM API directly.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  base64ToBytes,
  bytesToBase64,
  deriveAuthKey,
  deriveEncryptionKey,
  deriveKeys,
  generateNonce,
  generateSalt,
  type KdfParams,
} from "../crypto.js";

// Wrap hash-wasm's argon2id so tests can count how many times the KDF runs
const { argon2idSpy } = vi.hoisted(() => ({ argon2idSpy: vi.fn() }));
vi.mock("hash-wasm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("hash-wasm")>();
  return {
    ...actual,
    argon2id: (opts: Parameters<typeof actual.argon2id>[0]) => {
      argon2idSpy(opts);
      return actual.argon2id(opts);
    },
  };
});

beforeEach(() => argon2idSpy.mockClear());

const FAST_KDF_PARAMS: KdfParams = {
  version: 1,
  algorithm: "argon2id",
  memoryKiB: 1024,
  iterations: 2,
  parallelism: 1,
};

/** Raw AES-GCM encrypt, so we can prove key material without encryptVaultItem (a later PR). */
async function encryptWith(
  key: CryptoKey,
  text: string,
): Promise<{ nonce: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer }> {
  const nonce = generateNonce();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    new TextEncoder().encode(text),
  );
  return { nonce, ciphertext };
}

describe("deriveAuthKey / deriveEncryptionKey", () => {
  it("deriveAuthKey returns a deterministic 32-byte key", async () => {
    const salt = new Uint8Array(16).fill(7);
    const a = await deriveAuthKey("pw", salt, FAST_KDF_PARAMS);
    const b = await deriveAuthKey("pw", salt, FAST_KDF_PARAMS);
    expect(a).toHaveLength(32);
    expect(a).toEqual(b);
  });

  it("different password or salt changes the auth key", async () => {
    const salt = new Uint8Array(16).fill(7);
    const base = await deriveAuthKey("pw", salt, FAST_KDF_PARAMS);
    const otherPw = await deriveAuthKey("pw2", salt, FAST_KDF_PARAMS);
    const otherSalt = await deriveAuthKey("pw", new Uint8Array(16).fill(8), FAST_KDF_PARAMS);
    expect(base).not.toEqual(otherPw);
    expect(base).not.toEqual(otherSalt);
  });

  it("deriveEncryptionKey returns a non-extractable AES-GCM key", async () => {
    const key = await deriveEncryptionKey("pw", generateSalt(), FAST_KDF_PARAMS);
    expect(key.extractable).toBe(false);
    expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    expect(key.usages.sort()).toEqual(["decrypt", "encrypt"]); // only encrypt/decrypt, not export or sign
  });

  it("auth and encryption keys are independent (auth key cannot decrypt the enc key's output)", async () => {
    const salt = generateSalt();
    const encKey = await deriveEncryptionKey("pw", salt, FAST_KDF_PARAMS);
    const authKeyBytes = await deriveAuthKey("pw", salt, FAST_KDF_PARAMS);
    const { nonce, ciphertext } = await encryptWith(encKey, "secret");

    const authKeyAsAes = await crypto.subtle.importKey("raw", authKeyBytes, "AES-GCM", false, [
      "decrypt",
    ]);
    await expect(
      crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, authKeyAsAes, ciphertext),
    ).rejects.toThrow();
  });

  it("rejects unsupported KDF params versions", async () => {
    const badParams = { ...FAST_KDF_PARAMS, version: 2 } as unknown as KdfParams;
    await expect(deriveAuthKey("pw", generateSalt(), badParams)).rejects.toThrow(
      /Unsupported KDF params version/,
    );
  });

  it("rejects an empty salt", async () => {
    await expect(deriveAuthKey("pw", new Uint8Array(0), FAST_KDF_PARAMS)).rejects.toThrow(/salt/);
  });

  it("rejects out-of-range KDF params before they reach the WASM", async () => {
    const salt = generateSalt();
    await expect(deriveAuthKey("pw", salt, { ...FAST_KDF_PARAMS, memoryKiB: 0 })).rejects.toThrow(
      /memoryKiB/,
    );
    await expect(deriveAuthKey("pw", salt, { ...FAST_KDF_PARAMS, iterations: 1000 })).rejects.toThrow(
      /iterations/,
    );
    await expect(deriveAuthKey("pw", salt, { ...FAST_KDF_PARAMS, parallelism: 1.5 })).rejects.toThrow(
      /parallelism/,
    );
  });

  it("authKey serializes to a base64 string that fits the register/login API", async () => {
    const authKey = await deriveAuthKey("master-pw", generateSalt(), FAST_KDF_PARAMS);
    const serialized = bytesToBase64(authKey);
    // PR #4 validates authKey/salt as strings up to 1024 chars.
    expect(serialized.length).toBeLessThan(1024);
    expect(base64ToBytes(serialized)).toEqual(authKey);
  });
});

describe("deriveKeys", () => {
  it("derives both keys in one call, matching the standalone functions", async () => {
    const salt = generateSalt();
    const keys = await deriveKeys("master-pw", salt, FAST_KDF_PARAMS);

    // authKey matches the standalone derivation.
    expect(keys.authKey).toEqual(await deriveAuthKey("master-pw", salt, FAST_KDF_PARAMS));

    // deriveKeys' encryptionKey is the same key as the standalone one:
    // encrypt with one and the other can decrypt it.
    const standalone = await deriveEncryptionKey("master-pw", salt, FAST_KDF_PARAMS);
    const { nonce, ciphertext } = await encryptWith(keys.encryptionKey, "hello");
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, standalone, ciphertext);
    expect(new TextDecoder().decode(plain)).toBe("hello");
    expect(keys.encryptionKey.extractable).toBe(false);
  });

  it("a key from a different master password cannot decrypt", async () => {
    const salt = generateSalt();
    const right = await deriveEncryptionKey("master-pw", salt, FAST_KDF_PARAMS);
    const wrong = await deriveEncryptionKey("wrong-pw", salt, FAST_KDF_PARAMS);
    const { nonce, ciphertext } = await encryptWith(right, "hello");
    await expect(
      crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, wrong, ciphertext),
    ).rejects.toThrow();
  });
});

describe("Argon2id invocation", () => {
  it("deriveKeys runs Argon2id exactly once for both keys", async () => {
    await deriveKeys("master-pw", generateSalt(), FAST_KDF_PARAMS);
    expect(argon2idSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects a salt shorter than the minimum before invoking Argon2id", async () => {
    await expect(deriveAuthKey("pw", new Uint8Array(4), FAST_KDF_PARAMS)).rejects.toThrow(/salt/i);
    expect(argon2idSpy).not.toHaveBeenCalled();
  });

  it("rejects memoryKiB < 8 * parallelism before invoking Argon2id", async () => {
    await expect(
      deriveAuthKey("pw", generateSalt(), { ...FAST_KDF_PARAMS, memoryKiB: 8, parallelism: 2 }),
    ).rejects.toThrow(/memory/i);
    expect(argon2idSpy).not.toHaveBeenCalled();
  });
});
