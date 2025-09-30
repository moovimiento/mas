"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TOTAL_GRAMS = 220;
const MAX_PER_INGREDIENT = 88;
const MIN_NONZERO = 22;

const INGREDIENTS = [
  { id: "banana", name: "Banana chips" },
  { id: "pera", name: "Pera deshidratada" },
  { id: "almendras", name: "Almendras" },
  { id: "nueces", name: "Nueces" },
  { id: "uva", name: "Uva deshidratada" },
] as const;

type IngredientId = typeof INGREDIENTS[number]["id"];

type Mix = Record<IngredientId, number>;

type CartItem = {
  mix: Mix;
  quantity: number;
};

const preset44x5: Mix = {
  pera: 44,
  almendras: 44,
  nueces: 44,
  uva: 44,
  banana: 44,
};

export function MixBuilder() {
  const [mix, setMix] = useState<Mix>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moovimiento_mix');
      return saved ? JSON.parse(saved) : preset44x5;
    }
    return preset44x5;
  });
  const [selectedId, setSelectedId] = useState<IngredientId>("pera");
  const [deliveryOption, setDeliveryOption] = useState<"ciudad" | "envio">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moovimiento_deliveryOption');
      return saved ? JSON.parse(saved) : "ciudad";
    }
    return "ciudad";
  });
  const [deliveryAddress, setDeliveryAddress] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('moovimiento_deliveryAddress') || "";
    }
    return "";
  });
  const [phone, setPhone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('moovimiento_phone') || "";
    }
    return "";
  });
  const [name, setName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('moovimiento_name') || "";
    }
    return "";
  });
  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('moovimiento_email') || "";
    }
    return "";
  });
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moovimiento_cartItems');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [shakeRemaining, setShakeRemaining] = useState(false);
  const [hoveredIngredient, setHoveredIngredient] = useState<IngredientId | null>(null);

  const total = useMemo(() => Object.values(mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0), [mix]);
  const remaining = TOTAL_GRAMS - total;
  const isValid = total === TOTAL_GRAMS && Object.values(mix).every((g) => g >= 0 && g <= TOTAL_GRAMS);

  const percentages = useMemo(() => {
    return Object.fromEntries(
      (Object.keys(mix) as IngredientId[]).map((id) => [
        id,
        total > 0 ? Math.round(((mix[id] ?? 0) / total) * 100) : 0,
      ])
    ) as Record<IngredientId, number>;
  }, [mix, total]);

  // Pricing (ARS): base 4000 per mix; promos -> 5 for 18000, 15 for 48000
  const PRICE_SINGLE = 4000;
  const PRICE_PACK5 = 18000;  // per 5
  const PRICE_PACK15 = 48000; // per 15
  const DELIVERY_COST = 1000;

  const currency = useMemo(() => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }), []);

  function computePrice(qty: number) {
    // Greedy: maximize 15-packs, then 5-packs, then singles
    const n15 = Math.floor(qty / 15);
    let rem = qty - n15 * 15;
    const n5 = Math.floor(rem / 5);
    rem = rem - n5 * 5;
    const n1 = rem;
    const price = n15 * PRICE_PACK15 + n5 * PRICE_PACK5 + n1 * PRICE_SINGLE;
    const original = qty * PRICE_SINGLE;
    const discount = original - price;
    return { price, discount, breakdown: { n15, n5, n1 } };
  }

  const totalMixQty = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const isValidEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  // Guardar en localStorage cuando cambien los valores
  useEffect(() => {
    localStorage.setItem('moovimiento_mix', JSON.stringify(mix));
  }, [mix]);

  useEffect(() => {
    localStorage.setItem('moovimiento_cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('moovimiento_deliveryOption', JSON.stringify(deliveryOption));
  }, [deliveryOption]);

  useEffect(() => {
    localStorage.setItem('moovimiento_deliveryAddress', deliveryAddress);
  }, [deliveryAddress]);

  useEffect(() => {
    localStorage.setItem('moovimiento_phone', phone);
  }, [phone]);

  useEffect(() => {
    localStorage.setItem('moovimiento_name', name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem('moovimiento_email', email);
  }, [email]);

  const pricing = useMemo(() => {
    const basePrice = computePrice(totalMixQty);
    const deliveryCost = deliveryOption === "envio" ? DELIVERY_COST : 0;
    return {
      ...basePrice,
      price: basePrice.price + deliveryCost,
      deliveryCost,
    };
  }, [totalMixQty, deliveryOption]);

  function setGram(id: IngredientId, grams: number) {
    // Set grams for a single ingredient, ensuring the overall total never exceeds TOTAL_GRAMS
    setMix((prev) => {
      const desired = Math.max(0, Math.min(MAX_PER_INGREDIENT, Math.round(grams)));
      // Force even numbers
      const desiredEven = Math.round(desired / 2) * 2;
      const current = prev[id] ?? 0;
      const otherTotal = (Object.values(prev).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) - current);
      const maxAllowed = Math.max(0, TOTAL_GRAMS - otherTotal);
      // Max allowed should also be even (floor to even)
      const maxAllowedEven = Math.floor(maxAllowed / 2) * 2;
      const perIngredientEven = Math.floor(MAX_PER_INGREDIENT / 2) * 2;
      let nextVal = Math.min(desiredEven, maxAllowedEven, perIngredientEven);
      // Enforce 0 <-> 22 jump for non-zero values smaller than MIN_NONZERO
      if (nextVal > 0 && nextVal < MIN_NONZERO) nextVal = MIN_NONZERO;
      return { ...prev, [id]: nextVal } as Mix;
    });
  }

  function adjustGram(id: IngredientId, delta: number) {
    setMix((prev) => {
      const current = prev[id] ?? 0;
      const desired = Math.round(current + delta);
      // Force even desired
      const desiredEven = Math.round(desired / 2) * 2;
      const otherTotal = (Object.values(prev).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) - current);
      const maxAllowed = Math.max(0, TOTAL_GRAMS - otherTotal);
      // Cap to even maximum
      const maxAllowedEven = Math.floor(maxAllowed / 2) * 2;
      const perIngredientEven = Math.floor(MAX_PER_INGREDIENT / 2) * 2;
      let nextVal = Math.max(0, Math.min(desiredEven, maxAllowedEven, perIngredientEven));
      
      // Trigger shake animation if trying to add but no space
      if (delta > 0 && nextVal === current && maxAllowedEven === 0) {
        setShakeRemaining(true);
        setTimeout(() => setShakeRemaining(false), 500);
      }
      
      // Apply 0 <-> 22 jump logic
      if (delta > 0) {
        if (current === 0 && nextVal > 0) {
          // Jump to MIN_NONZERO only if there's enough space
          nextVal = maxAllowedEven >= MIN_NONZERO ? MIN_NONZERO : 0;
          if (nextVal === 0) {
            setShakeRemaining(true);
            setTimeout(() => setShakeRemaining(false), 500);
          }
        }
        if (nextVal > 0 && nextVal < MIN_NONZERO) nextVal = MIN_NONZERO;
      } else if (delta < 0) {
        if (current <= MIN_NONZERO && nextVal < current) nextVal = 0;
      }
      return { ...prev, [id]: nextVal } as Mix;
    });
  }

  // Press-and-hold support for +/- buttons
  const holdTimer = useRef<NodeJS.Timeout | null>(null)
  const holdActive = useRef(false)

  function startHold(id: IngredientId, delta: number) {
    if (holdActive.current) return
    holdActive.current = true
    // First immediate tick for responsiveness
    adjustGram(id, delta)
    holdTimer.current = setInterval(() => {
      adjustGram(id, delta)
    }, 100)
  }

  function stopHold() {
    if (holdTimer.current) {
      clearInterval(holdTimer.current)
      holdTimer.current = null
    }
    holdActive.current = false
  }

  useEffect(() => {
    return () => stopHold()
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <h2 className="text-2xl font-semibold">Armá tu mix (220g)</h2>
        <div className="text-sm text-muted-foreground whitespace-normal flex flex-col md:flex-row md:gap-4">
          <span>Mínimo por ingrediente: <span className="font-medium">0g ↔ 22g</span></span>
          <span>Máximo por ingrediente: <span className="font-medium">88g</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Ingredientes</CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={remaining === 0 ? "default" : "secondary"}
                  title={remaining > 0 ? `Agregá ${remaining}g más para completar tu mix` : "Mix completo - listo para agregar al carrito"}
                >
                  Total: {total}g
                </Badge>
                <Badge 
                  variant={remaining === 0 ? "secondary" : "default"}
                  className={shakeRemaining ? "animate-shake" : ""}
                  title={remaining > 0 ? `Agregá ${remaining}g más para completar tu mix` : "Mix completo - listo para agregar al carrito"}
                >
                  Restan: {remaining}g
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {INGREDIENTS.map((ing) => (
              <div key={ing.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div className={cn("font-medium", ing.id === selectedId && "text-yellow-600")}>{ing.name}</div>
                <div className={cn("flex items-center gap-2 rounded-md")}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onMouseDown={() => {
                      setSelectedId(ing.id);
                      startHold(ing.id, -2);
                    }}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => {
                      setSelectedId(ing.id);
                      startHold(ing.id, -2);
                    }}
                    onTouchEnd={stopHold}
                    onTouchCancel={stopHold}
                    aria-label={`Restar 2 gramos a ${ing.name}`}
                    disabled={(mix[ing.id] ?? 0) <= 0}
                  >
                    -
                  </Button>
                  <div className="relative">
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="number"
                      min={0}
                      max={MAX_PER_INGREDIENT}
                      value={mix[ing.id] ?? 0}
                      onChange={(e) => setGram(ing.id, Number(e.target.value))}
                      onFocus={() => setSelectedId(ing.id)}
                      className={cn(
                        "w-24 pr-6 text-right",
                        ing.id === selectedId &&
                          "border-yellow-500 focus-visible:ring-yellow-500 text-yellow-700"
                      )}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">g</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onMouseDown={() => {
                      setSelectedId(ing.id);
                      startHold(ing.id, +2);
                    }}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => {
                      setSelectedId(ing.id);
                      startHold(ing.id, +2);
                    }}
                    onTouchEnd={stopHold}
                    onTouchCancel={stopHold}
                    aria-label={`Sumar 2 gramos a ${ing.name}`}
                    disabled={remaining <= 0}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-center pt-2">
              <Button
                onClick={() => {
                  if (!isValid) {
                    setShakeRemaining(true);
                    setTimeout(() => setShakeRemaining(false), 500);
                    return;
                  }
                  const existingIndex = cartItems.findIndex(
                    (item) => JSON.stringify(item.mix) === JSON.stringify(mix)
                  );
                  if (existingIndex >= 0) {
                    // Same mix exists, increment quantity
                    setCartItems((prev) =>
                      prev.map((item, i) =>
                        i === existingIndex
                          ? { ...item, quantity: item.quantity + 1 }
                          : item
                      )
                    );
                  } else {
                    // New mix, add to cart
                    setCartItems((prev) => [...prev, { mix, quantity: 1 }]);
                  }
                  if (cartItems.length === 0) {
                    setDeliveryOption("envio");
                  }
                }}
                className={cn(
                  "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500",
                  !isValid && "opacity-50"
                )}
                title={!isValid ? `Completá los ${remaining}g restantes para agregar al carrito` : ""}
                aria-label={!isValid ? `Completá los ${remaining}g restantes para agregar al carrito` : "Agregar al carrito"}
              >
                Agregar al carrito
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader className="items-center text-center">
            <CardTitle>Distribución del mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col items-center justify-center">
            {/** Pie chart usando conic-gradient dinámico **/}
            {(() => {
              // Escala de celestes
              const colorById: Record<IngredientId, string> = {
                banana: "#7dd3fc",    // sky-300
                pera: "#38bdf8",      // sky-400
                almendras: "#0ea5e9", // sky-500
                nueces: "#0284c7",    // sky-600
                uva: "#0369a1",       // sky-700
              }

              const parts = (INGREDIENTS as readonly {id: IngredientId; name: string}[]).map((ing) => ({
                id: ing.id,
                name: ing.name,
                percent: percentages[ing.id] ?? 0,
                color: colorById[ing.id],
              }))
              let acc = 0
              const partsWithAngles = parts.map(p => {
                const start = acc
                const end = acc + p.percent
                acc = end
                return { ...p, startAngle: start * 3.6, endAngle: end * 3.6 }
              })
              const stops = partsWithAngles.map(p => {
                // Amarillo si está seleccionado (por hover o por selectedId), celeste normal si no
                const isSelected = hoveredIngredient ? p.id === hoveredIngredient : p.id === selectedId
                const color = isSelected ? '#fbbf24' : p.color // amarillo (amber-400) para seleccionado
                return `${color} ${p.startAngle / 3.6}% ${p.endAngle / 3.6}%`
              }).join(", ")
              const bg = `conic-gradient(${stops})`
              
              return (
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="relative size-48"
                    onMouseLeave={() => setHoveredIngredient(null)}
                  >
                    <div
                      className="size-48 rounded-full shadow-sm border"
                      style={{ background: bg }}
                      aria-label="Gráfico de torta de ingredientes"
                    />
                    {/* Segmentos invisibles para detectar hover */}
                    <svg className="absolute inset-0 size-48" viewBox="0 0 100 100">
                      {partsWithAngles.filter(p => p.percent > 0).map((p, i) => {
                        const startRad = (p.startAngle - 90) * Math.PI / 180
                        const endRad = (p.endAngle - 90) * Math.PI / 180
                        const largeArc = p.percent > 50 ? 1 : 0
                        const x1 = 50 + 50 * Math.cos(startRad)
                        const y1 = 50 + 50 * Math.sin(startRad)
                        const x2 = 50 + 50 * Math.cos(endRad)
                        const y2 = 50 + 50 * Math.sin(endRad)
                        
                        return (
                          <path
                            key={i}
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill="transparent"
                            className="cursor-pointer hover:opacity-80"
                            onMouseEnter={() => {
                              setHoveredIngredient(p.id);
                              setSelectedId(p.id);
                            }}
                            onClick={() => setSelectedId(p.id)}
                          />
                        )
                      })}
                    </svg>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {parts.map((p, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex items-center gap-2 cursor-pointer transition-colors",
                          p.id === selectedId && "text-yellow-600"
                        )}
                        onMouseEnter={() => setSelectedId(p.id)}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: p.color }} />
                        <span className={cn("text-muted-foreground", p.id === selectedId && "text-yellow-600 font-medium")}>{p.name}</span>
                        <span className={cn("ml-auto", p.id === selectedId && "font-bold")}>{p.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Carrito debajo del builder */}
      <Card>
        <CardHeader>
          <CardTitle>Carrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            {cartItems.length === 0 ? (
              <div className="text-muted-foreground">No hay mixs en el carrito. Armalo arriba y agregalo.</div>
            ) : (
              <>
                {cartItems.map((item, index) => {
                  const itemTotal = Object.values(item.mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
                  return (
                    <div key={index} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">Mix (220 g)</div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                            onClick={() => {
                              setCartItems((prev) =>
                                prev
                                  .map((cartItem, i) =>
                                    i === index
                                      ? { ...cartItem, quantity: Math.max(0, cartItem.quantity - 1) }
                                      : cartItem
                                  )
                                  .filter((cartItem) => cartItem.quantity > 0)
                              );
                              if (cartItems.length === 1 && item.quantity === 1) {
                                setDeliveryOption("ciudad");
                              }
                            }}
                            aria-label="Reducir cantidad de mix"
                          >
                            -
                          </Button>
                          <span className="min-w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                            onClick={() =>
                              setCartItems((prev) =>
                                prev.map((cartItem, i) =>
                                  i === index ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                                )
                              )
                            }
                            aria-label="Aumentar cantidad de mix"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="text-muted-foreground">
                        ({INGREDIENTS.filter((ing) => (item.mix[ing.id] ?? 0) > 0)
                          .map((ing) => {
                            const percent = itemTotal > 0 ? Math.round(((item.mix[ing.id] ?? 0) / itemTotal) * 100) : 0;
                            return `${ing.name} ${percent}%`;
                          })
                          .join(", ")})
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Gramos</div>
            <div className="text-right font-medium">{totalMixQty * TOTAL_GRAMS}g ⚡</div>
            <div className="text-muted-foreground">Delivery</div>
            <div className="text-right flex items-center justify-end gap-2">
              <button
                onClick={() => setDeliveryOption(deliveryOption === "ciudad" ? "envio" : "ciudad")}
                className="text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-1 cursor-pointer"
                aria-label="Opción anterior de delivery"
              >
                ←
              </button>
              <span>{deliveryOption === "ciudad" ? "Ciudad Universitaria (gratis)" : "Córdoba ($1000 de envío)"}</span>
              <button
                onClick={() => setDeliveryOption(deliveryOption === "ciudad" ? "envio" : "ciudad")}
                className="text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-1 cursor-pointer"
                aria-label="Siguiente opción de delivery"
              >
                →
              </button>
            </div>
          </div>

          {/* Campos de dirección y celular */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="delivery-address" className="text-sm text-muted-foreground block mb-1">
                {deliveryOption === "ciudad" ? "Facultad o lugar de entrega" : "Dirección de entrega"} <span className="text-red-500">*</span>
              </label>
              <Input
                id="delivery-address"
                type="text"
                placeholder={deliveryOption === "ciudad" ? "Ej: Pabellón Argentina" : "Ej: Av. Valparaíso 1234, Córdoba"}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm text-muted-foreground block mb-1">
                Celular (para coordinar la entrega) <span className="text-red-500">*</span>
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: 351 153 123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          {/* Campos de nombre y email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="text-sm text-muted-foreground block mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm text-muted-foreground block mb-1">
                Email (para recibir el resumen de la compra) <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          {/* Precios */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal (sin promo)</span>
              <span className={(pricing.discount > 0 || deliveryOption === "ciudad") ? "line-through text-muted-foreground" : "font-medium text-muted-foreground"}>
                {currency.format(totalMixQty > 0 ? (totalMixQty * PRICE_SINGLE + DELIVERY_COST) : 0)}
              </span>
            </div>
            {(pricing.discount > 0 || deliveryOption === "ciudad") && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ahorro acumulado</span>
                  <span className="text-green-600">{currency.format(pricing.discount + (deliveryOption === "ciudad" ? DELIVERY_COST : 0))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {deliveryOption === "ciudad" && pricing.discount > 0
                      ? "Total (con promo y envío gratis)"
                      : deliveryOption === "ciudad"
                      ? "Total (con envío gratis)"
                      : "Total (con promo)"}
                  </span>
                  <span className="font-semibold">{currency.format(pricing.price)}</span>
                </div>
              </>
            )}
            {pricing.discount === 0 && deliveryOption === "envio" && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Total (sin promo)</span>
                <span className="font-semibold">{currency.format(pricing.price)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <Button
              disabled={cartItems.length === 0 || !deliveryAddress.trim() || !phone.trim() || !name.trim() || !isValidEmail}
              onClick={async () => {
                try {
                  // Preparar items para Mercado Pago
                  const mixItems = cartItems.map((item) => {
                    const itemTotal = Object.values(item.mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
                    const ingredients = INGREDIENTS
                      .filter((ing) => (item.mix[ing.id] ?? 0) > 0)
                      .map((ing) => {
                        const percent = itemTotal > 0 ? Math.round(((item.mix[ing.id] ?? 0) / itemTotal) * 100) : 0;
                        return `${ing.name} ${percent}%`;
                      })
                      .join(", ");
                    
                    return {
                      title: `Mix personalizado (${ingredients})`,
                      quantity: item.quantity,
                      unit_price: PRICE_SINGLE,
                    };
                  });

                  // Agregar delivery si corresponde
                  const items = [...mixItems];
                  if (deliveryOption === "envio") {
                    items.push({
                      title: "Envío a Córdoba",
                      quantity: 1,
                      unit_price: 1000,
                    });
                  }

                  // Llamar a la API para crear la preferencia primero
                  const response = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      items,
                      deliveryOption,
                      deliveryAddress,
                      email,
                      name,
                      phone,
                    }),
                  });

                  const data = await response.json();

                  if (data.error) {
                    console.error("API Error:", data.error);
                    alert(`Error: ${data.error}`);
                    return;
                  }

                  if (data.init_point) {
                    // Enviar email con resumen y link de pago
                    await fetch("/api/send-order-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name,
                        email,
                        phone,
                        items: mixItems,
                        deliveryOption,
                        deliveryAddress,
                        totalPrice: pricing.price,
                        totalMixQty,
                        paymentLink: data.init_point,
                      }),
                    });

                    // Redirigir a Mercado Pago
                    window.location.href = data.init_point;
                  } else {
                    alert("Error al crear el checkout");
                  }
                } catch (error) {
                  console.error("Error:", error);
                  alert("Error al procesar el checkout");
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
            >
              Ir al checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
