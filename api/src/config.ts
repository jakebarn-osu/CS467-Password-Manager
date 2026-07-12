const { JWT_SECRET, SALT_PEPPER } = process.env;

// Fail fast at startup if a required secret is missing, mirroring db.ts.
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}
if (!SALT_PEPPER) {
  throw new Error("SALT_PEPPER is not set");
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// JWT lifetime is kept as a number of seconds so it satisfies jsonwebtoken's
// stricter expiresIn typing without a duration string.
export const config = Object.freeze({
  JWT_SECRET,
  SALT_PEPPER,
  JWT_EXPIRES_IN_SECONDS: parsePositiveInt(process.env.JWT_EXPIRES_IN_SECONDS, 900),
  PORT: parsePositiveInt(process.env.PORT, 5000),
});
