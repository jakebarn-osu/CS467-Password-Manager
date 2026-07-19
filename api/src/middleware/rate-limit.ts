import rateLimit from "express-rate-limit";
import { config } from "../config.js";

// Throttles the auth surface to blunt online guessing. Keyed on client IP with a
// configurable window and ceiling, and returns 429 once the ceiling is passed.
export const authLimiter = rateLimit({
  windowMs: config.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: config.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});
