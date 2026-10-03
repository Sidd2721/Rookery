// In-memory rate limiter for PIN attempts
const attempts: Record<string, { count: number; firstAttempt: number }> = {};

export function checkPinRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts[ip];
  
  if (!record) {
    attempts[ip] = { count: 1, firstAttempt: now };
    return true;
  }
  
  if (now - record.firstAttempt > 5 * 60 * 1000) {
    // Reset after 5 minutes
    attempts[ip] = { count: 1, firstAttempt: now };
    return true;
  }
  
  if (record.count >= 5) {
    return false; // Rate limited
  }
  
  record.count += 1;
  return true;
}

export function verifyPin(pin: string): boolean {
  const expected = process.env.CLERK_PIN || '';
  if (!pin || !expected) return false;
  
  // Constant time comparison (simple version)
  let diff = expected.length ^ pin.length;
  for (let i = 0; i < expected.length && i < pin.length; i++) {
    diff |= expected.charCodeAt(i) ^ pin.charCodeAt(i);
  }
  
  return diff === 0;
}
