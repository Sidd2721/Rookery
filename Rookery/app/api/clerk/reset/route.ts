import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
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

  try {
    await store.clearVisits();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

