import { createClient as createSupabaseServerClient } from './supabase/server';

export type OrderItem = {
  title?: string;
  quantity?: number;
  unit_price?: number;
  [k: string]: unknown;
};

export type OrderRecord = {
  id: string;
  name?: string;
  email: string;
  phone: string;
  items: OrderItem[];
  deliveryOption: string;
  deliveryAddress?: string;
  totalPrice: number;
  totalMixQty: number;
  paymentMethod?: string;
  paymentLink?: string;
  discountCode?: string | null;
  discountAmount?: number;
  status?: string;
  createdAt?: string;
};

function toSnake(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    out[snake] = (obj as Record<string, unknown>)[key];
  }
  return out;
}

function toCamel(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const parts = key.split('_');
    if (parts.length === 1) {
      out[key] = (obj as Record<string, unknown>)[key];
      continue;
    }
    const camel = parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    out[camel] = (obj as Record<string, unknown>)[key];
  }
  return out;
}

export async function saveOrder(order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>) {
  const supabase = await createSupabaseServerClient();
  const id = `order_${Date.now()}`;

  const record = {
    id,
    ...order,
    status: 'pending',
  };

  // Convert to snake_case for Postgres
  const dbRecord = toSnake(record) as Record<string, unknown>;

  const { error } = await supabase.from('orders').insert(dbRecord);
  if (error) {
    console.error('Error saving order to supabase:', error);
    throw error;
  }

  return id;
}

export async function getOrders() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders from supabase:', error);
    throw error;
  }
  // Map snake_case rows to camelCase expected by the app
  const mapped = (data || []).map((r: Record<string, unknown>) => toCamel(r));
  return mapped as unknown as OrderRecord[];
}

export async function markOrderDelivered(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', id);
  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
  return true;
}

export async function markOrderPending(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('orders').update({ status: 'pending' }).eq('id', id);
  if (error) {
    console.error('Error updating order status to pending:', error);
    throw error;
  }
  return true;
}
