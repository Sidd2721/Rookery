import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { mapNeed } from '@/lib/ai';

// Rate limiter: 10/min per IP
const rateLimiter = new Map<string, { count: number; first: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateLimiter.get(ip);
  if (!rec) { rateLimiter.set(ip, { count: 1, first: now }); return true; }
  if (now - rec.first > 60000) { rateLimiter.set(ip, { count: 1, first: now }); return true; }
  if (rec.count >= 10) return false;
  rec.count++;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { office_id, text } = body;

    const trimmed = (text || '').trim().slice(0, 200);
    if (!trimmed) {
      return NextResponse.json({ error: 'text_required' }, { status: 400 });
    }

    if (!office_id) {
      return NextResponse.json({ error: 'office_id_required' }, { status: 400 });
    }

    const services = await store.getServices(office_id);
    const result = await mapNeed(trimmed, services);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
