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
    const body = await request.json();
    const { visit_id } = body;
    if (!visit_id) {
      return NextResponse.json({ error: 'Missing visit_id' }, { status: 400 });
    }

    const visit = await store.getVisit(visit_id);
    if (!visit || visit.status !== 'serving') {
      return NextResponse.json({ error: 'Invalid visit or not serving' }, { status: 400 });
    }

    await store.updateVisit(visit_id, { status: 'done' });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

