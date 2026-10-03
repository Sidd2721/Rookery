import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const office_id = searchParams.get('office_id');
  
  if (!office_id) {
    return NextResponse.json({ error: 'Missing office_id' }, { status: 400 });
  }

  const services = await store.getServices(office_id);
  return NextResponse.json(services);
}
