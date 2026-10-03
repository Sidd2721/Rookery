import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { verifyPin, checkPinRateLimit } from '@/lib/security';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!checkPinRateLimit(ip)) {
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
  }

  const pin = request.headers.get('x-clerk-pin');
  if (!pin || !verifyPin(pin)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { office_id } = body;
    if (!office_id) {
      return NextResponse.json({ error: 'Missing office_id' }, { status: 400 });
    }

    const services = await store.getServices(office_id);
    if (services.length === 0) {
      return NextResponse.json({ error: 'No services found' }, { status: 400 });
    }

    const s1 = services[0];
    
    // 1 gathering with 2 items ticked
    await store.createVisit({
      id: uuidv4(),
      office_id,
      service_id: s1.id,
      items_checked: s1.checklist.slice(0, 2).map(i => i.id),
      status: 'gathering',
      token_no: null,
      sent_back_reason: null,
      created_at: new Date().toISOString(),
      ready_at: null,
    });

    // 2 ready
    const token1 = await store.getNextTokenNo(office_id);
    await store.createVisit({
      id: uuidv4(),
      office_id,
      service_id: s1.id,
      items_checked: s1.checklist.map(i => i.id),
      status: 'ready',
      token_no: token1,
      sent_back_reason: null,
      created_at: new Date().toISOString(),
      ready_at: new Date().toISOString(),
    });

    const token2 = await store.getNextTokenNo(office_id);
    await store.createVisit({
      id: uuidv4(),
      office_id,
      service_id: s1.id,
      items_checked: s1.checklist.map(i => i.id),
      status: 'ready',
      token_no: token2,
      sent_back_reason: null,
      created_at: new Date().toISOString(),
      ready_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
