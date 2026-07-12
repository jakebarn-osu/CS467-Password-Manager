import { Router } from "express";
import { z } from "zod";
import type { VaultItem, VaultItemListResponse } from "@app/shared";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/require-auth.js";
import {
  createVaultItem,
  findVaultItemById,
  listVaultItems,
} from "../repositories/vault-items.js";
import type { VaultItemRecord } from "../repositories/vault-items.js";

export const vaultRouter = Router();

const createSchema = z.object({
  encryptedData: z.string().min(1).max(8192),
});

const paramsSchema = z.object({
  id: z.uuid(),
});

function toVaultItem(row: VaultItemRecord): VaultItem {
  return {
    id: row.id,
    encryptedData: row.encrypted_data,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

vaultRouter.get(
  "/items",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await listVaultItems(req.auth!.userId);
    const body: VaultItemListResponse = { items: rows.map(toVaultItem) };
    res.status(200).json(body);
  }),
);

vaultRouter.post(
  "/items",
  requireAuth,
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const { encryptedData } = req.body as z.infer<typeof createSchema>;
    const row = await createVaultItem({ userId: req.auth!.userId, encryptedData });
    res.status(201).json(toVaultItem(row));
  }),
);

vaultRouter.get(
  "/items/:id",
  requireAuth,
  validate({ params: paramsSchema }),
  asyncHandler(async (req, res) => {
    // A missing id and a non-owned id both come back null so we answer 404 either way.
    const item = await findVaultItemById(req.auth!.userId, req.params.id);
    if (!item) {
      throw new HttpError(404, "Not found");
    }
    res.status(200).json(toVaultItem(item));
  }),
);
