import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { office_id, service_id } = body;

    if (!office_id || !service_id) {
      return NextResponse.json({ error: 'Missing office_id or service_id' }, { status: 400 });
    }

    const service = await store.getService(service_id);
    if (!service || service.office_id !== office_id) {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }

    const visitId = uuidv4();
    await store.createVisit({
      id: visitId,
      office_id,
      service_id,
      items_checked: [],
      status: 'gathering',
      token_no: null,
      sent_back_reason: null,
      created_at: new Date().toISOString(),
      ready_at: null,
    });

    return NextResponse.json({ visit_id: visitId });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
