import { NextResponse } from 'next/server';
import { verifyPin, recordFailedPin, isIpLocked } from '@/lib/security';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  if (isIpLocked(ip)) {
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
  }

  const pin = request.headers.get('x-clerk-pin');
  if (!pin || !verifyPin(pin)) {
    recordFailedPin(ip);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
