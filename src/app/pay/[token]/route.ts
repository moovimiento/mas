import { NextResponse } from 'next/server';
import { verifyPayToken } from '@/lib/payToken';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Mercado Pago client
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    const payload = verifyPayToken(token);
    if (!payload || !payload.orderId) {
      return NextResponse.redirect('/?error=invalid_token');
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('orders').select('*').eq('id', payload.orderId).single();
    if (error || !data) {
      console.error('Order not found for pay token:', payload.orderId, error);
      return NextResponse.redirect('/?error=order_not_found');
    }

    const order = data as Record<string, any>;

    // If we already have a payment_link saved, redirect to it
    if (order.payment_link) {
      return NextResponse.redirect(order.payment_link as string);
    }

    // Otherwise create a preference now and persist it
    const items = (order.items || []) as Array<any>;
    const preference = new Preference(mpClient);

    const preferenceItems = items.map((it: any, idx: number) => ({
      id: `item-${idx}`,
      title: it.title,
      quantity: it.quantity,
      unit_price: it.unit_price,
      currency_id: 'ARS',
    }));

    // If there is a discount amount saved, push as negative item
    if (order.discount_amount && Number(order.discount_amount) > 0) {
      preferenceItems.push({
        id: `discount-${order.discount_code || 'disc'}`,
        title: `Descuento (${order.discount_code || ''})`,
        quantity: 1,
        unit_price: -Number(order.discount_amount),
        currency_id: 'ARS',
      });
    }

    const backBase = process.env.NEXT_PUBLIC_BASE_URL || '';
    const preferenceData = {
      items: preferenceItems,
      back_urls: {
        success: `${backBase}/checkout/success`,
        failure: `${backBase}/checkout/failure`,
        pending: `${backBase}/checkout/pending`,
      },
      notification_url: `${backBase}/api/webhooks/mercadopago`,
      auto_return: 'approved',
      statement_descriptor: 'MOOVIMIENTO',
      external_reference: JSON.stringify({ orderId: order.id }),
      payer: {
        email: order.email,
        name: order.name,
      },
      locale: 'es-AR',
    };

    const resp = await preference.create({ body: preferenceData as any });
    const initPoint = resp.init_point;

    // Persist init_point in order
    try {
      await supabase.from('orders').update({ payment_link: initPoint, preference_id: resp.id, pref_created_at: new Date().toISOString() }).eq('id', payload.orderId);
    } catch (e) {
      console.error('Error updating order with preference', e);
    }

    return NextResponse.redirect(initPoint as string);
  } catch (e) {
    console.error('Error in /pay route:', e);
    return NextResponse.redirect('/?error=server_error');
  }
}
