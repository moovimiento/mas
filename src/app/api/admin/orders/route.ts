import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/orders';

export async function GET(request: NextRequest) {
  try {
    const adminPass = request.headers.get('x-admin-password') || '';
    if (!process.env.ADMIN_PASSWORD || adminPass !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await getOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
  }
}
