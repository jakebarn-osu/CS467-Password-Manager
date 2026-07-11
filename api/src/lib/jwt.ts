import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signAccessToken(userId: string): string {
  return jwt.sign({}, config.JWT_SECRET, {
    subject: userId,
    jwtid: randomUUID(),
    algorithm: "HS256",
    expiresIn: config.JWT_EXPIRES_IN_SECONDS,
  });
}

export function verifyAccessToken(token: string): {
  userId: string;
  jti: string;
  exp: number;
} {
  const decoded = jwt.verify(token, config.JWT_SECRET, {
    algorithms: ["HS256"],
  });
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.sub !== "string" ||
    typeof decoded.jti !== "string" ||
    typeof decoded.exp !== "number"
  ) {
    throw new Error("Invalid token payload");
  }
  return { userId: decoded.sub, jti: decoded.jti, exp: decoded.exp };
}
