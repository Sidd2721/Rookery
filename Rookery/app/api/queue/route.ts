import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const office_id = searchParams.get('office_id');
  
  if (!office_id) {
    return NextResponse.json({ error: 'Missing office_id' }, { status: 400 });
  }

  const visits = await store.getVisits();
  const officeVisits = visits.filter(v => v.office_id === office_id);

  const serving = officeVisits.find(v => v.status === 'serving') || null;
  const ready = officeVisits.filter(v => v.status === 'ready').sort((a, b) => (a.token_no || 0) - (b.token_no || 0));
  
  const now = new Date().getTime();
  const gathering = officeVisits.filter(v => {
    if (v.status !== 'gathering') return false;
    const created = new Date(v.created_at).getTime();
    return (now - created) < 6 * 60 * 60 * 1000; // < 6h
  });

  const served_ready = officeVisits.filter(v => v.status === 'done').length;
  const sent_back = officeVisits.filter(v => v.status === 'sent_back').length;

  return NextResponse.json({
    serving,
    ready,
    gathering,
    counters: { served_ready, sent_back }
  });
}
