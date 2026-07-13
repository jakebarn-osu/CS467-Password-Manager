/**
 * Round-trip and negative tests for the payload/encoding helpers.
 */
import { describe, expect, it } from "vitest";

import {
  base64ToBytes,
  bytesToBase64,
  decodeEncryptedPayload,
  encodeEncryptedPayload,
  generateNonce,
  PAYLOAD_VERSION,
} from "../crypto.js";

describe("base64 helpers", () => {
  it("round-trips arbitrary bytes", () => {
    const bytes = crypto.getRandomValues(new Uint8Array(37));
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it("rejects malformed base64", () => {
    expect(() => base64ToBytes("not base64 !!!")).toThrow();
  });
});

describe("encodeEncryptedPayload / decodeEncryptedPayload", () => {
  it("round-trips version, nonce, and ciphertext", () => {
    const original = {
      version: PAYLOAD_VERSION,
      nonce: generateNonce(),
      ciphertext: crypto.getRandomValues(new Uint8Array(48)),
    };
    const decoded = decodeEncryptedPayload(encodeEncryptedPayload(original));
    expect(decoded).toEqual(original);
  });

  it("rejects a nonce of the wrong length", () => {
    expect(() =>
      encodeEncryptedPayload({
        version: PAYLOAD_VERSION,
        nonce: new Uint8Array(11) as Uint8Array<ArrayBuffer>,
        ciphertext: new Uint8Array(16) as Uint8Array<ArrayBuffer>,
      }),
    ).toThrow(/nonce/);
  });

  it("rejects an unsupported payload version", () => {
    const bytes = new Uint8Array(1 + 12 + 16);
    bytes[0] = 99;
    expect(() => decodeEncryptedPayload(bytesToBase64(bytes))).toThrow(
      /Unsupported payload version: 99/,
    );
  });

  it("rejects payloads that are too short", () => {
    expect(() => decodeEncryptedPayload(bytesToBase64(new Uint8Array(5)))).toThrow(/too short/);
  });

  it("encode rejects what decode would reject (symmetric validation)", () => {
    const nonce = generateNonce();
    const ciphertext = crypto.getRandomValues(new Uint8Array(32));
    // Wrong version (including >255, which would silently truncate to a byte).
    expect(() => encodeEncryptedPayload({ version: 99, nonce, ciphertext })).toThrow(
      /Unsupported payload version: 99/,
    );
    expect(() => encodeEncryptedPayload({ version: 256, nonce, ciphertext })).toThrow(
      /Unsupported payload version: 256/,
    );
    // Ciphertext shorter than a GCM tag.
    expect(() =>
      encodeEncryptedPayload({
        version: PAYLOAD_VERSION,
        nonce,
        ciphertext: new Uint8Array(0) as Uint8Array<ArrayBuffer>,
      }),
    ).toThrow(/ciphertext/);
  });

  it("decode wraps malformed base64 in this library's error style", () => {
    expect(() => decodeEncryptedPayload("not base64 !!!")).toThrow(/not valid base64/);
  });
});
