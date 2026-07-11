import { createHmac } from "node:crypto";
import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import type { RegisterResponse, SaltResponse } from "@app/shared";
import { config } from "../config.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { createUser, findUserByEmail } from "../repositories/users.js";

export const authRouter = Router();

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(255));

const registerSchema = z.object({
  email: emailSchema,
  authKey: z.string().min(1).max(1024),
  salt: z.string().min(1).max(1024),
});

const saltQuerySchema = z.object({
  email: emailSchema,
});

authRouter.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { email, authKey, salt } = req.body as z.infer<typeof registerSchema>;
    const authHash = await argon2.hash(authKey);
    try {
      const user = await createUser({ email, authHash, userSalt: salt });
      const body: RegisterResponse = { id: user.id, email: user.email };
      res.status(201).json(body);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new HttpError(409, "Email already registered");
      }
      throw err;
    }
  }),
);

authRouter.get(
  "/salt",
  validate({ query: saltQuerySchema }),
  asyncHandler(async (req, res) => {
    const { email } = req.query as unknown as z.infer<typeof saltQuerySchema>;
    const user = await findUserByEmail(email);
    // Unknown emails get a deterministic, same-shaped salt so the response
    // does not reveal whether an account exists.
    const salt = user ? user.user_salt : deriveDecoySalt(email);
    const body: SaltResponse = { salt };
    res.status(200).json(body);
  }),
);

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

function deriveDecoySalt(email: string): string {
  const digest = createHmac("sha256", config.SALT_PEPPER).update(email).digest();
  return digest.subarray(0, 16).toString("base64");
}
