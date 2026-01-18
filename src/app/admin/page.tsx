"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { OrderItem } from '@/lib/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';


type Order = {
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

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoSubject, setPromoSubject] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoHtml, setPromoHtml] = useState('');
  const [promoEmailsText, setPromoEmailsText] = useState('');
  const [promoEmails, setPromoEmails] = useState<string[]>([]);
  const [showAddRecipientInput, setShowAddRecipientInput] = useState(false);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [editingEmailIndex, setEditingEmailIndex] = useState<number | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');
  const [promoCoverDataUrl, setPromoCoverDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const subjectInputRef = useRef<HTMLInputElement | null>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [personalTarget, setPersonalTarget] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  type SortKey = 'createdAt' | 'name' | 'email' | 'phone' | 'totalMixQty' | 'totalPrice' | 'status' | 'id' | null;
  const [sortBy, setSortBy] = useState<SortKey>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'delivered'>('all');
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'ciudad' | 'cordoba'>('all');
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // Small helper to render a consistent sort icon for all sortable headers
  function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
    const base = active ? 'text-yellow-400' : 'text-gray-500';
    return (
      <span className={`w-6 text-right ${base}`} aria-hidden>
        {active ? (asc ? '↑' : '↓') : '⇅'}
      </span>
    );
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/orders', { headers: { 'x-admin-password': password } });
      if (res.status === 401) {
        setAuthed(false);
        setMessage('Contraseña inválida');
        setOrders([]);
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      setMessage('Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    if (authed) fetchOrders();
  }, [authed, fetchOrders]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!filterOpen) return;
      const el = filterRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [filterOpen]);

  function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setMessage(null);
    setAuthed(true);
    // fetchOrders will run from effect, but call directly to avoid waiting
    fetchOrders();
  }



  function toggleSelect(id: string) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSelectAllDisplayed() {
    const ids = displayedOrders.map(o => o.id);
    const anyUnselected = ids.some(id => !selected[id]);
    if (anyUnselected) {
      // select all displayed
      setSelected(prev => {
        const next = { ...prev };
        ids.forEach(id => { next[id] = true; });
        return next;
      });
    } else {
      // deselect all displayed
      setSelected(prev => {
        const next = { ...prev };
        ids.forEach(id => { delete next[id]; });
        return next;
      });
    }
  }

  async function markDelivered(id: string) {
    setMessage(null);
    try {
      const res = await fetch('/api/admin/mark-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (res.ok) {
        setMessage('Pedido marcado como entregado');
        fetchOrders();
      } else {
        setMessage(j.error || 'Error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error');
    }
  }

  async function markPending(id: string) {
    setMessage(null);
    try {
      const res = await fetch('/api/admin/mark-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (res.ok) {
        setMessage('Pedido marcado como pendiente');
        fetchOrders();
      } else {
        setMessage(j.error || 'Error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error');
    }
  }

  async function sendPromo() {
    setMessage(null);
    const ids = Object.keys(selected).filter(id => selected[id]);
    const emails = promoEmails || [];
    if (ids.length === 0 && emails.length === 0 && !personalTarget) {
      setMessage('Seleccioná al menos un pedido o cargá/pegá al menos un mail');
      return;
    }
    if (!promoSubject || !promoHtml) {
      setMessage('Completá asunto y contenido del mail');
      return;
    }
    try {
      const res = await fetch('/api/admin/send-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ orderIds: ids, emails: emails.length > 0 ? emails : undefined, subject: promoSubject, title: promoTitle, html: promoHtml, headerImage: promoCoverDataUrl }),
      });
      const j = await res.json();
      if (res.ok) {
        // show concise success toast for 3s and clear state
        toast.success('Promos enviadas', { duration: 3000 });
        console.log('send-promo results', j.results);
        setPromoOpen(false);
        setPromoSubject('');
        setPromoTitle('');
        setPromoHtml('');
        setSelected({});
        setPersonalTarget(null);
        setPromoEmails([]);
        setPromoEmailsText('');
      } else {
        setMessage(j.error || 'Error enviando promos');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error enviando promos', { duration: 3000 });
    }
  }



  // Template helpers for preview and variable insertion
  function insertVariable(varName: string, target: 'html' | 'subject' = 'html') {
    if (target === 'subject') {
      const el = subjectInputRef.current;
      const start = el?.selectionStart ?? promoSubject.length;
      const end = el?.selectionEnd ?? start;
      const next = promoSubject.slice(0, start) + varName + promoSubject.slice(end);
      setPromoSubject(next);
      setTimeout(() => el?.focus(), 0);
      return;
    }
    const ta = htmlTextareaRef.current;
    const start = ta?.selectionStart ?? promoHtml.length;
    const end = ta?.selectionEnd ?? start;
    const next = promoHtml.slice(0, start) + varName + promoHtml.slice(end);
    setPromoHtml(next);
    setTimeout(() => ta?.focus(), 0);
  }

  function buildPreviewHtml() {
    const headerImageHtml = promoCoverDataUrl ? `<div style="text-align:center;margin:12px 0;"><img src=\"${promoCoverDataUrl}\" alt=\"Portada\" style=\"max-width:100%;height:auto;border-radius:8px;\"/></div>` : '';
    const titleHtml = promoTitle ? `<h1 style="font-size:20px;color:#fbbf24;margin-bottom:8px;">${promoTitle}</h1>` : '';

    // For preview only: if we have a personal target, interpolate {{name}} with the real name
    let previewContent = promoHtml || '';
    if (personalTarget && previewContent) {
      const safeName = personalTarget.name || '';
      previewContent = previewContent.replace(/{{\s*name\s*}}/gi, safeName);
    }

    // Render content as a single column in the preview (avoid automatic 2-column split)
    const contentHtml = previewContent || '';

    const wrapped = `
      <div style="font-family: Arial, sans-serif; max-width:600px; background:#fff; border:1px solid #e5e7eb; padding:16px; border-radius:6px;">
        <div style="background:#fbbf24;padding:12px;border-radius:6px 6px 0 0;color:white;font-weight:600;">⚡ Moovimiento</div>
        <div style="padding:12px;">
          ${titleHtml}
          ${headerImageHtml}
          <div style="width:100%">${contentHtml}</div>
          <p style="margin-top:12px;color:#666;font-size:13px;">Si tenés alguna duda escribinos a <a href=\"mailto:gonza@moovimiento.com\">gonza@moovimiento.com</a></p>
        </div>
      </div>
    `;
    return wrapped;
  }

  function wrapHtmlSelection(openTag: string, closeTag: string) {
    const ta = htmlTextareaRef.current;
    const start = ta?.selectionStart ?? promoHtml.length;
    const end = ta?.selectionEnd ?? start;
    const selected = promoHtml.slice(start, end) || 'Texto';
    const next = promoHtml.slice(0, start) + openTag + selected + closeTag + promoHtml.slice(end);
    setPromoHtml(next);
    setTimeout(() => {
      if (ta) {
        ta.focus();
        const newStart = start + openTag.length;
        ta.selectionStart = newStart;
        ta.selectionEnd = newStart + selected.length;
      }
    }, 0);
  }

  function insertCta() {
    const snippet = `<div style="text-align:center;margin:12px 0;"><a href="https://mas.moovimiento.com" style="display:inline-block;background:#fbbf24;color:#000;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Realizá ahora tu pedido</a></div>`;
    insertVariable(snippet, 'html');
  }

  // Aliases / convenience wrappers used by toolbar buttons (some buttons call the other name)
  function insertCTA() {
    return insertCta();
  }

  function wrapSelection(openTag: string, closeTag: string) {
    return wrapHtmlSelection(openTag, closeTag);
  }

  // Derived/list state: apply search, filter and sort
  const selectedIds = Object.keys(selected).filter(id => selected[id]);
  const displayedOrders = orders
    .filter(o => {
      if (!o) return false;
      // status filter
      if (filterStatus !== 'all') {
        if ((o.status || 'pending') !== filterStatus) return false;
      }
      // delivery filter
      if (filterDelivery !== 'all') {
        if ((o.deliveryOption || '') !== filterDelivery) return false;
      }
      // date range filter
      if (dateFrom) {
        const from = new Date(dateFrom + 'T00:00:00');
        const created = o.createdAt ? new Date(o.createdAt) : null;
        if (!created || created < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo + 'T23:59:59');
        const created = o.createdAt ? new Date(o.createdAt) : null;
        if (!created || created > to) return false;
      }
      // search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hay = `${o.id} ${o.name || ''} ${o.email} ${o.phone || ''} ${o.deliveryAddress || ''}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      // sort by selected column
      const direction = sortAsc ? 1 : -1;
      if (!sortBy || sortBy === 'createdAt') {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (ta - tb) * direction;
      }
      const va: unknown = (a as unknown as Record<string, unknown>)[sortBy as string];
      const vb: unknown = (b as unknown as Record<string, unknown>)[sortBy as string];
      // handle numbers
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * direction;
      }
      // fallback to string compare
      const sa = (va ?? '').toString().toLowerCase();
      const sb = (vb ?? '').toString().toLowerCase();
      if (sa < sb) return -1 * direction;
      if (sa > sb) return 1 * direction;
      return 0;
    });

  // last N days buckets for mini charts (last month)
  const lastNDays = 30;
  const dayBuckets = (() => {
    const arr = Array.from({ length: lastNDays }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (lastNDays - 1 - i));
      const key = d.toISOString().slice(0, 10);
      return { date: key, count: 0, revenue: 0 };
    });
    orders.forEach(o => {
      if (!o.createdAt) return;
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const bucket = arr.find(x => x.date === key);
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += (o.totalPrice || 0);
      }
    });
    return arr;
  })();

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ingresá al Panel de Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="ADMIN_PASSWORD"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" className="hover:cursor-pointer">Entrar</Button>
                <Button type="button" variant="outline" className="hover:cursor-pointer" onClick={() => { setPassword(''); setMessage(null); }}>Limpiar</Button>
              </div>
              {message && <p className="mt-2 text-sm text-destructive">{message}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-12 lg:px-24 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold">Panel de Admin: Pedidos de ⚡</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => fetchOrders()}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6" />
            </svg>
            {loading ? 'Cargando...' : 'Refrescar'}
          </Button>

          {/* Top 'Orden' button removed per UI request */}

          {/* Filtrar moved below (between search and date filters) */}



          <Button className="w-full sm:w-auto" onClick={() => {
            // If there are selected orders, open the promo modal and show the recipients list
            const ids = selectedIds;
            setPersonalTarget(null);
            const def = ids.length > 0 ? `Promo exclusiva para ${ids.length} clientes` : `Promo exclusiva`;
            setPromoSubject(def);
            setPromoTitle(def);
            setPromoHtml(`<p>Hola! Tenemos una promo para vos...</p>`);
            setPromoOpen(true);
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {selectedIds.length > 0 ? `Enviar mail a los clientes seleccionados (${selectedIds.length})` : 'Enviar promo masiva'}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        {/* Dashboard card separated from search */}
        <Card className="mb-6">
          <CardContent>
            <div className="grid grid-cols-1 gap-4 items-start">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto justify-items-center">
                <div onClick={() => {
                  // clear filters
                  setFilterStatus('all');
                  setFilterDelivery('all');
                  setDateFrom(null);
                  setDateTo(null);
                  setSearchQuery('');
                  setFilterOpen(false);
                }} className="bg-slate-800 p-6 rounded text-sm cursor-pointer hover:bg-slate-700 flex flex-col items-center justify-center min-h-[84px] w-full">
                  <div className="text-xs text-gray-400">Pedidos totales</div>
                  <div className="text-lg font-medium">{orders.length}</div>
                </div>
                <div onClick={() => { setFilterStatus('pending'); setDateFrom(null); setDateTo(null); setSearchQuery(''); setFilterOpen(false); }} className="bg-slate-800 p-6 rounded text-sm cursor-pointer hover:bg-slate-700 flex flex-col items-center justify-center min-h-[84px] w-full">
                  <div className="text-xs text-gray-400">Pendientes</div>
                  <div className="text-lg font-medium">{orders.filter(o => (o.status || 'pending') === 'pending').length}</div>
                </div>
                <div onClick={() => { setFilterStatus('delivered'); setDateFrom(null); setDateTo(null); setSearchQuery(''); setFilterOpen(false); }} className="bg-slate-800 p-6 rounded text-sm cursor-pointer hover:bg-slate-700 flex flex-col items-center justify-center min-h-[84px] w-full">
                  <div className="text-xs text-gray-400">Entregados</div>
                  <div className="text-lg font-medium">{orders.filter(o => (o.status || '') === 'delivered').length}</div>
                </div>
                <div className="bg-slate-800 p-6 rounded text-sm flex flex-col items-center justify-center min-h-[84px] w-full">
                  <div className="text-xs text-gray-400">Ingresos</div>
                  <div className="text-lg font-medium">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(orders.reduce((s, o) => s + (o.totalPrice || 0), 0))}</div>
                </div>
                {/* Selected count moved to table header */}
              </div>
              {/* charts row: pedidos and ingresos in own row, two columns */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 lg:col-span-3">
                <div>
                  <div className="text-xs text-gray-400 mb-2">Pedidos (últimos {lastNDays} días)</div>
                  <div className="w-full bg-slate-900 p-2 rounded">
                    <svg viewBox={`0 0 ${lastNDays * 20} 48`} width="100%" height={48} preserveAspectRatio="none">
                      {(() => {
                        const width = lastNDays * 20;
                        const height = 48;
                        const max = Math.max(...dayBuckets.map(d => d.count), 1);
                        const points = dayBuckets.map((d, i) => {
                          const x = i * (width / (lastNDays - 1));
                          const y = height - Math.round((d.count / max) * (height - 6)) - 2;
                          return `${x},${y}`;
                        }).join(' ');
                        return (
                          <>
                            <polyline fill="none" stroke="#facc15" strokeWidth={2} points={points} />
                            {dayBuckets.map((d, i) => {
                              const x = i * (width / (lastNDays - 1));
                              const barH = Math.round((d.count / max) * (height - 6));
                              return <rect key={i} x={x - 3} y={height - 2 - barH} width={6} height={barH} fill="#f59e0b" opacity={0.9} />;
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">Ingresos (últimos {lastNDays} días)</div>
                  <div className="w-full bg-slate-900 p-2 rounded">
                    <svg viewBox={`0 0 ${lastNDays * 18} 48`} width="100%" height={48} preserveAspectRatio="none">
                      {(() => {
                        const height = 48;
                        const max = Math.max(...dayBuckets.map(d => d.revenue), 1);
                        return dayBuckets.map((d, i) => {
                          const barW = 12;
                          const gap = 6;
                          const x = i * (barW + gap) + 2;
                          const h = Math.round((d.revenue / max) * (height - 8));
                          return <rect key={i} x={x} y={height - h - 4} width={barW} height={h} fill="#60a5fa" />;
                        });
                      })()}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search on its own row, filters on the row below */}
        <div className="mb-6 p-4 bg-transparent border-b border-slate-800" />

        <div className="mb-4">
          <Input className="w-full" placeholder="Buscar por id, nombre, email, teléfono o dirección" value={searchQuery} onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)} />
        </div>

        <div className="flex flex-col gap-3 w-full">
          {/* Mobile layout: Desde/Hasta stacked with buttons to the right */}
          <div className="sm:hidden w-full">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Desde</label>
                <input type="date" value={dateFrom ?? ''} onChange={(e) => setDateFrom(e.target.value || null)} className="bg-slate-800 text-white p-1 rounded" />
              </div>
              <div ref={filterRef} className="relative">
                <Button variant="outline" onClick={() => { setFilterOpen(f => !f); }}>
                  Filtrar
                </Button>
                {filterOpen && (
                  <div className="absolute left-0 mt-2 bg-slate-900 text-white border border-slate-700 rounded shadow p-3 z-50 w-80" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-sm block">Estado</label>
                        <select className="mt-1 w-full bg-slate-800 text-white border border-slate-700 p-1 rounded" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'delivered')}>
                          <option value="all">Todos</option>
                          <option value="pending">Pendiente</option>
                          <option value="delivered">Entregado</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm block">Delivery</label>
                        <select className="mt-1 w-full bg-slate-800 text-white border border-slate-700 p-1 rounded" value={filterDelivery} onChange={(e) => setFilterDelivery(e.target.value as 'all' | 'ciudad' | 'cordoba')}>
                          <option value="all">Todos</option>
                          <option value="ciudad">Ciudad (envío)</option>
                          <option value="cordoba">Córdoba</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Hasta</label>
                <input type="date" value={dateTo ?? ''} onChange={(e) => setDateTo(e.target.value || null)} className="bg-slate-800 text-white p-1 rounded" />
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <Button variant="destructive" onClick={async (e) => {
                    e.stopPropagation();
                    const ok = window.confirm(`Borrar ${selectedIds.length} pedido(s)? Esta acción es irreversible.`);
                    if (!ok) return;
                    try {
                      const res = await fetch('/api/admin/delete-orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
                        body: JSON.stringify({ ids: selectedIds }),
                      });
                      const j = await res.json();
                      if (res.ok) {
                        setMessage('Pedidos eliminados');
                        setSelected({});
                        fetchOrders();
                      } else {
                        setMessage(j.error || 'Error al eliminar pedidos');
                      }
                    } catch (err) {
                      console.error('Error deleting orders', err);
                      setMessage('Error al eliminar pedidos');
                    }
                  }}>
                    Borrar registro
                  </Button>
                )}
                {selectedIds.length > 0 && (
                  <Button variant="outline" onClick={() => { setSelected({}); }}>Deseleccionar</Button>
                )}
                <Button variant="outline" onClick={() => { setDateFrom(null); setDateTo(null); }}>Limpiar fechas</Button>
              </div>
            </div>
          </div>

          {/* Desktop / sm+ layout: Filtrar on left, dates inline to the right */}
          <div className="hidden sm:flex sm:items-center gap-3 w-full">
            <div ref={filterRef} className="relative">
              <Button variant="outline" onClick={() => { setFilterOpen(f => !f); }}>
                Filtrar
              </Button>
              {filterOpen && (
                <div className="absolute left-0 mt-2 bg-slate-900 text-white border border-slate-700 rounded shadow p-3 z-50 w-80" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-sm block">Estado</label>
                      <select className="mt-1 w-full bg-slate-800 text-white border border-slate-700 p-1 rounded" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'delivered')}>
                        <option value="all">Todos</option>
                        <option value="pending">Pendiente</option>
                        <option value="delivered">Entregado</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm block">Delivery</label>
                      <select className="mt-1 w-full bg-slate-800 text-white border border-slate-700 p-1 rounded" value={filterDelivery} onChange={(e) => setFilterDelivery(e.target.value as 'all' | 'ciudad' | 'cordoba')}>
                        <option value="all">Todos</option>
                        <option value="ciudad">Ciudad (envío)</option>
                        <option value="cordoba">Córdoba</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Desde</label>
              <input type="date" value={dateFrom ?? ''} onChange={(e) => setDateFrom(e.target.value || null)} className="bg-slate-800 text-white p-1 rounded" />
              <label className="text-sm text-gray-400">Hasta</label>
              <input type="date" value={dateTo ?? ''} onChange={(e) => setDateTo(e.target.value || null)} className="bg-slate-800 text-white p-1 rounded" />
              {selectedIds.length > 0 && (
                <Button variant="destructive" onClick={async (e) => {
                  e.stopPropagation();
                  const ok = window.confirm(`Borrar ${selectedIds.length} pedido(s)? Esta acción es irreversible.`);
                  if (!ok) return;
                  try {
                    const res = await fetch('/api/admin/delete-orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
                      body: JSON.stringify({ ids: selectedIds }),
                    });
                    const j = await res.json();
                    if (res.ok) {
                      setMessage('Pedidos eliminados');
                      setSelected({});
                      fetchOrders();
                    } else {
                      setMessage(j.error || 'Error al eliminar pedidos');
                    }
                  } catch (err) {
                    console.error('Error deleting orders', err);
                    setMessage('Error al eliminar pedidos');
                  }
                }}>
                  Borrar registro
                </Button>
              )}
              {selectedIds.length > 0 && (
                <Button variant="outline" onClick={() => { setSelected({}); }}>Deseleccionar</Button>
              )}
              <Button variant="outline" onClick={() => { setDateFrom(null); setDateTo(null); }}>Limpiar fechas</Button>
            </div>
          </div>
        </div>
      </div>

      {message && <div className="mb-4 text-sm text-destructive">{message}</div>}

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-12 py-3 text-left text-white w-56 min-w-[180px]">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelectAllDisplayed(); }} className="flex items-center gap-2 hover:underline">
                      <span className="font-medium">Sel</span>
                      <span className="text-sm text-gray-300 whitespace-nowrap">({selectedIds.length})</span>
                    </button>
                  </th>
                  {/* ID column moved to the end */}
                  <th className="px-12 py-3 text-left text-white">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'createdAt') setSortAsc(s => !s); else { setSortBy('createdAt'); setSortAsc(false); } }}>
                      <span className="truncate max-w-[140px]">Fecha</span>
                      <SortIcon active={sortBy === 'createdAt'} asc={sortAsc} />
                    </button>
                  </th>
                  <th className="px-12 py-3 text-left text-white min-w-[220px]">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'createdAt') setSortAsc(s => !s); else { setSortBy('createdAt'); setSortAsc(false); } }}>
                      <span className="truncate max-w-[140px] text-left">Hora</span>
                      <SortIcon active={sortBy === 'createdAt'} asc={sortAsc} />
                    </button>
                  </th>
                  <th className="px-12 py-3 text-left text-white min-w-[220px]">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'name') setSortAsc(s => !s); else { setSortBy('name'); setSortAsc(false); } }}>
                      Cliente {sortBy === 'name' ? (sortAsc ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th className="px-12 py-3 text-left text-white">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'email') setSortAsc(s => !s); else { setSortBy('email'); setSortAsc(false); } }}>
                      Email {sortBy === 'email' ? (sortAsc ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th className="px-12 py-3 text-left text-white">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'phone') setSortAsc(s => !s); else { setSortBy('phone'); setSortAsc(false); } }}>
                      Tel {sortBy === 'phone' ? (sortAsc ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th className="px-12 py-3 text-left text-white min-w-[280px]">
                    <span>Dirección</span>
                  </th>
                  <th className="px-12 py-3 text-left text-white">Delivery</th>
                  <th className="px-12 py-3 text-left text-white">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'totalMixQty') setSortAsc(s => !s); else { setSortBy('totalMixQty'); setSortAsc(false); } }}>
                      Mixes {sortBy === 'totalMixQty' ? (sortAsc ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th className="px-12 py-3 text-left text-white">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'totalPrice') setSortAsc(s => !s); else { setSortBy('totalPrice'); setSortAsc(false); } }}>
                      <span className="truncate max-w-[140px]">Total</span>
                      <SortIcon active={sortBy === 'totalPrice'} asc={sortAsc} />
                    </button>
                  </th>
                  <th className="px-12 py-3 text-left text-white">Código</th>
                  <th className="px-12 py-3 text-left text-white">Descuento</th>
                  <th className="px-12 py-3 text-left text-white">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'status') setSortAsc(s => !s); else { setSortBy('status'); setSortAsc(false); } }}>
                      Estado {sortBy === 'status' ? (sortAsc ? '↑' : '↓') : ''}
                    </button>
                  </th>
                  <th className="px-8 py-3 text-left text-white">Acciones</th>
                  <th className="px-8 py-3 text-left text-white">Enviar mails</th>
                  <th className="px-12 py-3 text-left text-white">
                    <button className="flex items-center gap-2 hover:cursor-pointer" onClick={() => { if (sortBy === 'id') setSortAsc(s => !s); else { setSortBy('id'); setSortAsc(false); } }}>
                      ID {sortBy === 'id' ? (sortAsc ? '↑' : '↓') : ''}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map(o => (
                  <tr key={o.id} onClick={() => { setDetailOrder(o); setDetailOpen(true); }} className="border-t bg-slate-900 even:bg-slate-800 hover:bg-yellow-300 hover:text-black text-white group cursor-pointer">
                    <td className="px-12 py-3 text-center text-white group-hover:text-black w-56 min-w-[180px]">
                      <input onClick={(e) => e.stopPropagation()} className="cursor-pointer" type="checkbox" checked={!!selected[o.id]} onChange={() => toggleSelect(o.id)} />
                    </td>
                    {/* ID cell moved to the end of the row */}
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-AR', { dateStyle: 'short' }) : '-'}</td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black min-w-[220px]">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('es-AR', { timeStyle: 'short' }) : '-'}</td>
                    <td title={o.name || o.email || ''} className="px-12 py-3 text-white group-hover:text-black min-w-[220px]">{o.name || '-'}</td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">{o.email}</td>
                    <td className="px-12 py-3 text-sm w-40">
                      {o.phone ? (
                        <a
                          onClick={(e) => e.stopPropagation()}
                          href={`https://wa.me/${(o.phone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-green-400 group-hover:text-green-600 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.52 3.48A11.86 11.86 0 0012 .99 11.96 11.96 0 00.99 12c0 2.11.55 4.09 1.51 5.82L.01 24l6.36-1.68A11.93 11.93 0 0012 23.01c6.63 0 11.99-5.36 11.99-11.99 0-3.2-1.25-6.2-3.48-8.54zM12 21.28c-1.35 0-2.68-.36-3.84-1.03l-.27-.16-3.8 1.01 1.02-3.7-.18-.3A9.17 9.17 0 012.79 12 9.21 9.21 0 1112 21.28zM17.18 14.37c-.29-.14-1.7-.84-1.96-.94-.27-.1-.45-.15-.64.16-.19.31-.73 1.02-.89 1.22-.16.2-.32.22-.59.08-.27-.14-1.15-.44-2.19-1.38-.81-.72-1.36-1.61-1.51-1.88-.15-.27-.02-.41.12-.58.11-.12.24-.32.36-.48.11-.16.15-.27.23-.45.07-.18.04-.34-.02-.48-.06-.14-.56-1.54-.77-2.1-.2-.54-.4-.47-.55-.48-.14-.01-.29-.01-.45-.01-.16 0-.42.06-.64.36-.22.3-.84 1.02-.84 2.48 0 1.44.93 2.83 1.06 3.03.13.21 1.85 2.95 4.49 4.14.63.27 1.12.44 1.5.56.57.18 1.09.16 1.5.09.46-.07 1.42-.57 1.62-1.12.2-.55.2-1.03.14-1.12-.07-.1-.24-.16-.47-.28z" />
                          </svg>
                          {o.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">
                      {o.deliveryAddress ? (
                        <a onClick={(e) => e.stopPropagation()} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.deliveryAddress)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:underline">
                          {o.deliveryAddress}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">{o.deliveryOption || '-'}</td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">{o.totalMixQty}</td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">${o.totalPrice}</td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">{o.discountCode || '-'}</td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">{o.discountAmount ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(o.discountAmount) : '-'}</td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">{o.status}</td>
                    <td className="px-12 py-3 text-sm">
                      {o.status === 'delivered' ? (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); markPending(o.id); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Marcar como pendiente
                        </Button>
                      ) : (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); markDelivered(o.id); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Marcar como entregado
                        </Button>
                      )}
                    </td>
                    <td className="px-8 py-3 text-sm">
                      <Button size="sm" variant="ghost" onClick={(e) => {
                        e.stopPropagation();
                        // open personal promo modal for this order
                        setSelected({ [o.id]: true });
                        setPersonalTarget(o);
                        const personalDef = `Promo exclusiva para ${o.name || o.email}`;
                        setPromoSubject(personalDef);
                        setPromoTitle(personalDef);
                        // Prefill with template placeholder instead of concrete name
                        setPromoHtml(`<p>Hola {{name}}! 👋</p><p>Tenemos una promo para vos...</p>`);
                        setPromoOpen(true);
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Redactar
                      </Button>
                    </td>
                    <td className="px-12 py-3 text-sm text-white group-hover:text-black">{o.id}</td>
                  </tr>
                ))}
                {displayedOrders.length === 0 && (
                  <tr>
                    <td colSpan={16} className="px-12 py-6 text-center text-gray-500">No hay pedidos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {promoOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => { setPromoOpen(false); setPersonalTarget(null); }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <Card className="w-full min-w-[720px] max-h-[86vh] overflow-auto">
              <CardHeader>
                <CardTitle>{personalTarget ? 'Enviar mail personalizado' : 'Enviar promo'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* If there are selected recipients, show them here */}
                  <div className="bg-slate-800 text-sm text-gray-200 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Destinatarios ({selectedIds.length + promoEmails.length})</div>
                      <div className="flex items-center gap-2">
                        <button type="button" className="text-sm px-2 py-1 bg-slate-700 rounded" onClick={() => setShowAddRecipientInput(s => !s)}>+</button>
                      </div>
                    </div>

                    {/* List selected order recipients (cannot edit email, but can remove) */}
                    {selectedIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedIds.map(id => {
                          const ord = orders.find(o => o.id === id);
                          if (!ord) return null;
                          return (
                            <span key={id} className="bg-slate-700 px-3 py-1 rounded text-sm flex items-center gap-2">
                              <span>{ord.name ? `${ord.name} <${ord.email}>` : ord.email}</span>
                              <button type="button" aria-label="Eliminar destinatario" className="text-red-400 hover:text-red-500" onClick={() => { setSelected(prev => { const next = { ...prev }; delete next[id]; return next; }); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 10-2 0v7a1 1 0 102 0V8zm4 0a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Raw email recipients (editable) */}
                    {promoEmails.length > 0 && (
                      <div className="flex flex-col gap-2 mb-2">
                        {promoEmails.map((em, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {editingEmailIndex === idx ? (
                              <>
                                <Input className="w-full" value={editingEmailValue} onChange={(e) => setEditingEmailValue((e.target as HTMLInputElement).value)} />
                                <Button size="sm" onClick={() => {
                                  const v = editingEmailValue.trim();
                                  if (!v) return;
                                  setPromoEmails(prev => prev.map((p, i) => i === idx ? v : p));
                                  setPromoEmailsText(prev => promoEmails.map((p, i) => i === idx ? v : p).join('\n'));
                                  setEditingEmailIndex(null);
                                }}>Guardar</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingEmailIndex(null)}>Cancelar</Button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-sm">{em}</span>
                                <Button size="sm" variant="outline" onClick={() => { setEditingEmailIndex(idx); setEditingEmailValue(em); }}>Editar</Button>
                                <button type="button" aria-label="Eliminar email" className="text-red-400 hover:text-red-500" onClick={() => {
                                  setPromoEmails(prev => prev.filter((_, i) => i !== idx));
                                  setPromoEmailsText(prev => promoEmails.filter((_, i) => i !== idx).join('\n'));
                                }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 10-2 0v7a1 1 0 102 0V8zm4 0a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add recipient input (toggleable) */}
                    {showAddRecipientInput && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input className="flex-1" placeholder="email@example.com" value={newRecipientEmail} onChange={(e) => setNewRecipientEmail((e.target as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === 'Enter') { const v = newRecipientEmail.trim(); if (v) { setPromoEmails(prev => { const next = [...prev, v]; setPromoEmailsText(next.join('\n')); return next; }); setNewRecipientEmail(''); setShowAddRecipientInput(false); } } }} />
                        <Button onClick={() => { const v = newRecipientEmail.trim(); if (!v) return; setPromoEmails(prev => { const next = [...prev, v]; setPromoEmailsText(next.join('\n')); return next; }); setNewRecipientEmail(''); setShowAddRecipientInput(false); }}>Agregar</Button>
                        <Button variant="outline" onClick={() => { setShowAddRecipientInput(false); setNewRecipientEmail(''); }}>Cancelar</Button>
                      </div>
                    )}
                  </div>
                  {!personalTarget && (
                    <>
                      <div className="pt-3 pb-2">
                        <Label className='pb-3'>Importar CSV de mails</Label>
                        <div className="flex gap-2 items-start mt-2">
                          <input ref={fileInputRef} type="file" accept=".csv,text/plain" onChange={async (e) => {
                            const f = (e.target as HTMLInputElement).files?.[0];
                            if (!f) return;
                            try {
                              const txt = await f.text();
                              // split by comma or newline
                              const raw = txt.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
                              setPromoEmails(raw.filter(r => r.includes('@')));
                              setPromoEmailsText(raw.filter(r => r.includes('@')).join('\n'));
                            } catch (err) {
                              console.error('Error reading file', err);
                            }
                          }} />
                          <Button variant="outline" onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }}>Cargar archivo</Button>
                        </div>
                      </div>

                      {/* Move paste textarea to its own row and change label text */}
                      <div className="mt-3">
                        <Label className="mb-1">O directamente pegarlos uno por linea (o separados por coma)</Label>
                        <textarea rows={4} className="w-full border px-3 py-2 rounded mt-1" placeholder="mail1@example.com, mail2@example.com or one per line" value={promoEmailsText} onChange={(e) => {
                          const v = (e.target as HTMLTextAreaElement).value;
                          setPromoEmailsText(v);
                          const parsed = v.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean).filter(s => s.includes('@'));
                          setPromoEmails(parsed);
                        }} />
                      </div>
                    </>
                  )}

                  {/* Cover image upload for promo (optional) */}
                  <div className="mt-4">
                    <Label>Foto de portada (opcional)</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input ref={coverInputRef} type="file" accept="image/*" onChange={async (e) => {
                        const f = (e.target as HTMLInputElement).files?.[0];
                        if (!f) return;
                        try {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const res = reader.result as string | null;
                            if (res) setPromoCoverDataUrl(res);
                          };
                          reader.readAsDataURL(f);
                        } catch (err) {
                          console.error('Error reading image', err);
                        }
                      }} style={{ display: 'none' }} />
                      <Button variant="outline" onClick={() => { if (coverInputRef.current) coverInputRef.current.click(); }}>
                        {promoCoverDataUrl ? 'Actualizar foto' : 'Subir foto'}
                      </Button>
                      {promoCoverDataUrl && (
                        <div className="ml-3 flex items-center gap-2">
                          <img src={promoCoverDataUrl} alt="Portada" className="max-h-24 rounded border" />
                          <button type="button" aria-label="Eliminar foto" className="text-red-400 hover:text-red-500" onClick={() => { setPromoCoverDataUrl(null); if (coverInputRef.current) coverInputRef.current.value = ''; }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 10-2 0v7a1 1 0 102 0V8zm4 0a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Label>Título (aparece en el mail)</Label>
                  <Input value={promoTitle} onChange={e => setPromoTitle((e.target as HTMLInputElement).value)} />

                  <Label className="mt-2">Asunto (solo en el asunto del mail)</Label>
                  <Input ref={subjectInputRef} value={promoSubject} onChange={e => setPromoSubject((e.target as HTMLInputElement).value)} />

                  {/* Top tools row removed per request: kept the HTML toolbar below instead */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="pb-4">
                      <Label className="mb-2">HTML</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Button size="sm" variant="outline" onClick={() => wrapHtmlSelection('<strong>', '</strong>')}>B</Button>
                        <Button size="sm" variant="outline" onClick={() => wrapHtmlSelection('<em>', '</em>')}>I</Button>
                        <Button size="sm" variant="outline" onClick={() => wrapHtmlSelection('<h2>', '</h2>')}>H2</Button>
                        <Button size="sm" variant="outline" onClick={() => insertVariable('<hr/>', 'html')}>Separador</Button>
                        <Button size="sm" variant="outline" onClick={() => insertCta()}>Insertar CTA</Button>
                        <Button size="sm" variant="outline" onClick={() => insertVariable('{{name}}', 'html')}>Insertar {'{{name}}'}</Button>
                        <Button size="sm" variant="outline" onClick={() => insertVariable('<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia.</p>', 'html')}>Agregar párrafo (Lorem)</Button>
                      </div>
                      <textarea ref={htmlTextareaRef} rows={12} className="w-full border px-3 py-2 rounded h-[420px]" value={promoHtml} onChange={e => setPromoHtml(e.target.value)} />
                    </div>
                    <div className="pb-4">
                      <Label className="mb-2">Vista previa</Label>
                      <div className="w-full h-[420px] border rounded p-3 overflow-auto bg-slate-900 text-gray-200">
                        <div dangerouslySetInnerHTML={{ __html: buildPreviewHtml() }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" onClick={() => { setPromoOpen(false); setPersonalTarget(null); }}>
                    Cancelar
                  </Button>
                  <Button onClick={() => sendPromo()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Enviar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* detail modal temporarily disabled to fix TSX parse error; will restore after build */}
    </div>
  );
}
