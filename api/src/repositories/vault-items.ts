import { pool } from "../db.js";

export interface VaultItemRecord {
  id: string;
  user_id: string;
  encrypted_data: string;
  created_at: Date;
  updated_at: Date;
}

// Every statement is parameterized and scoped by user_id so one user never reads another user's rows.
export async function listVaultItems(userId: string): Promise<VaultItemRecord[]> {
  const result = await pool.query<VaultItemRecord>(
    "SELECT id, user_id, encrypted_data, created_at, updated_at FROM vault_items WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return result.rows;
}

export async function findVaultItemById(
  userId: string,
  id: string,
): Promise<VaultItemRecord | null> {
  const result = await pool.query<VaultItemRecord>(
    "SELECT id, user_id, encrypted_data, created_at, updated_at FROM vault_items WHERE user_id = $1 AND id = $2",
    [userId, id],
  );
  return result.rows[0] ?? null;
}

export async function createVaultItem(input: {
  userId: string;
  encryptedData: string;
}): Promise<VaultItemRecord> {
  const result = await pool.query<VaultItemRecord>(
    "INSERT INTO vault_items (user_id, encrypted_data) VALUES ($1, $2) RETURNING id, user_id, encrypted_data, created_at, updated_at",
    [input.userId, input.encryptedData],
  );
  return result.rows[0];
}

export async function updateVaultItem(
  userId: string,
  id: string,
  encryptedData: string,
): Promise<VaultItemRecord | null> {
  const result = await pool.query<VaultItemRecord>(
    "UPDATE vault_items SET encrypted_data = $3, updated_at = now() WHERE user_id = $1 AND id = $2 RETURNING id, user_id, encrypted_data, created_at, updated_at",
    [userId, id, encryptedData],
  );
  return result.rows[0] ?? null;
}

export async function deleteVaultItem(userId: string, id: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM vault_items WHERE user_id = $1 AND id = $2",
    [userId, id],
  );
  return (result.rowCount ?? 0) > 0;
}
