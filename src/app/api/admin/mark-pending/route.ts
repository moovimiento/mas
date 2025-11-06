import { NextRequest, NextResponse } from 'next/server';
import { markOrderPending } from '@/lib/orders';

export async function POST(request: NextRequest) {
  try {
    const adminPass = request.headers.get('x-admin-password') || '';
    if (!process.env.ADMIN_PASSWORD || adminPass !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body || {};
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await markOrderPending(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error marking pending:', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
