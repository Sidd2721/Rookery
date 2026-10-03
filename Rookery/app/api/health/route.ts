import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    store: process.env.STORE_DRIVER || 'memory',
    mock: process.env.MOCK_MODE === 'true'
  });
}
