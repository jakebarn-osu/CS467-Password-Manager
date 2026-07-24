import { pool } from "../db.js";

export interface UserRecord {
  id: string;
  email: string;
  auth_hash: string;
  user_salt: string;
  totp_secret: string | null;
  mfa_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

// All statements are parameterized; caller input is never concatenated into SQL.
export async function createUser(input: {
  email: string;
  authHash: string;
  userSalt: string;
}): Promise<{ id: string; email: string }> {
  const result = await pool.query<{ id: string; email: string }>(
    "INSERT INTO users (email, auth_hash, user_salt) VALUES ($1, $2, $3) RETURNING id, email",
    [input.email, input.authHash, input.userSalt],
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    "SELECT id, email, auth_hash, user_salt, totp_secret, mfa_enabled, created_at, updated_at FROM users WHERE email = $1",
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    "SELECT id, email, auth_hash, user_salt, totp_secret, mfa_enabled, created_at, updated_at FROM users WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function setTotpSecret(userId: string, secret: string): Promise<void> {
  await pool.query(
    "UPDATE users SET totp_secret = $2, mfa_enabled = false, updated_at = now() WHERE id = $1",
    [userId, secret],
  );
}

export async function enableMfa(userId: string): Promise<void> {
  await pool.query(
    "UPDATE users SET mfa_enabled = true, updated_at = now() WHERE id = $1",
    [userId],
  );
}

export async function disableMfa(userId: string): Promise<void> {
  await pool.query(
    "UPDATE users SET totp_secret = NULL, mfa_enabled = false, updated_at = now() WHERE id = $1",
    [userId],
  );
}
