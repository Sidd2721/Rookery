// In-memory rate limiter — tracks FAILED PIN attempts only
const failedAttempts: Record<string, { count: number; firstAttempt: number }> = {};

/**
 * Call AFTER verifyPin when the PIN is wrong.
 * Returns false (→ 429) if this IP has 5+ failures in 5 minutes.
 */
export function recordFailedPin(ip: string): boolean {
  const now = Date.now();
  const record = failedAttempts[ip];

  if (!record) {
    failedAttempts[ip] = { count: 1, firstAttempt: now };
    return true; // first failure, still allowed
  }

  if (now - record.firstAttempt > 5 * 60 * 1000) {
    failedAttempts[ip] = { count: 1, firstAttempt: now };
    return true;
  }

  record.count += 1;
  return record.count <= 5; // false = rate limited
}

export function clearFailedPin(ip: string): void {
  delete failedAttempts[ip];
}

export function isIpLocked(ip: string): boolean {
  const now = Date.now();
  const record = failedAttempts[ip];
  if (!record) return false;
  if (now - record.firstAttempt > 5 * 60 * 1000) return false;
  return record.count >= 5;
}

export function verifyPin(pin: string): boolean {
  const expected = process.env.CLERK_PIN || '';
  if (!pin || !expected) return false;

  // Constant-time comparison
  let diff = expected.length ^ pin.length;
  for (let i = 0; i < expected.length && i < pin.length; i++) {
    diff |= expected.charCodeAt(i) ^ pin.charCodeAt(i);
  }

  return diff === 0;
}
