import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./error.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { isBlocked } from "../lib/token-blocklist.js";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; jti: string; exp: number };
    }
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const { userId, jti, exp } = verifyAccessToken(token);
    if (isBlocked(jti)) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    req.auth = { userId, jti, exp };
    next();
  } catch {
    next(new HttpError(401, "Unauthorized"));
  }
}

export {};
