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
    const { office_id } = body;
    if (!office_id) {
      return NextResponse.json({ error: 'Missing office_id' }, { status: 400 });
    }

    const visits = await store.getVisits();
    const officeVisits = visits.filter(v => v.office_id === office_id);

    if (officeVisits.some(v => v.status === 'serving')) {
      return NextResponse.json({ error: 'finish_current_first' }, { status: 409 });
    }

    const readyVisits = officeVisits.filter(v => v.status === 'ready').sort((a, b) => (a.token_no || 0) - (b.token_no || 0));
    
    if (readyVisits.length === 0) {
      return NextResponse.json({ error: 'no_ready_visits' }, { status: 409 });
    }

    const nextVisit = readyVisits[0];
    const updated = await store.updateVisit(nextVisit.id, { status: 'serving' });
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

