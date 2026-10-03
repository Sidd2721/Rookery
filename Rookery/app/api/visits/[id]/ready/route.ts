import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { calculateWaitTime } from '@/lib/wait';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await store.getVisit(id);
  
  if (!visit) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (visit.status !== 'gathering' && visit.status !== 'sent_back') {
    if (visit.token_no !== null) {
      const wait_min = await calculateWaitTime(visit);
      return NextResponse.json({ token_no: visit.token_no, wait_min });
    }
  }

  const service = await store.getService(visit.service_id);
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 400 });
  }

  const allItems = service.checklist.map(i => i.id);
  const allChecked = allItems.every(i => visit.items_checked.includes(i));

  if (!allChecked) {
    return NextResponse.json({ error: 'not_all_ready' }, { status: 400 });
  }

  const token_no = await store.getNextTokenNo(visit.office_id);
  const updated = await store.updateVisit(id, {
    status: 'ready',
    token_no,
    ready_at: new Date().toISOString()
  });

  const wait_min = await calculateWaitTime(updated!);
  return NextResponse.json({ token_no, wait_min });
}
