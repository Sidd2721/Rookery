import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { calculateWaitTime, getAheadCount } from '@/lib/wait';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await store.getVisit(id);
  
  if (!visit) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const wait_min = await calculateWaitTime(visit);
  const ahead = await getAheadCount(visit);

  return NextResponse.json({ ...visit, wait_min, ahead });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await store.getVisit(id);
  
  if (!visit) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (body.items_checked && Array.isArray(body.items_checked)) {
      const service = await store.getService(visit.service_id);
      if (!service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 400 });
      }
      
      const validIds = service.checklist.map(i => i.id);
      const filtered = body.items_checked.filter((i: string) => validIds.includes(i));
      
      const updated = await store.updateVisit(id, { items_checked: filtered });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
