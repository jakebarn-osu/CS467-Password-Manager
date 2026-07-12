// In-memory jti -> expiry (epoch seconds). Single-instance store: entries are
// lost on restart and not shared across instances, which is acceptable for this
// local single-instance deployment. Keyed to token expiry, a blocked token is
// rejected only until it would have expired anyway.
const blocked = new Map<string, number>();

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function prune(): void {
  const now = nowSeconds();
  for (const [jti, exp] of blocked) {
    if (exp <= now) {
      blocked.delete(jti);
    }
  }
}

export function block(jti: string, exp: number): void {
  prune();
  blocked.set(jti, exp);
}

export function isBlocked(jti: string): boolean {
  const exp = blocked.get(jti);
  if (exp === undefined) {
    return false;
  }
  if (exp <= nowSeconds()) {
    blocked.delete(jti);
    return false;
  }
  return true;
}
