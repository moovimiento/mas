"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TOTAL_GRAMS = 220;
const MAX_PER_INGREDIENT = 88;
const MIN_NONZERO = 22;

const INGREDIENTS = [
  { id: "pera", name: "Pera deshidratada" },
  { id: "almendras", name: "Almendras" },
  { id: "nueces", name: "Nueces" },
  { id: "uva", name: "Uva deshidratada" },
  { id: "banana", name: "Banana chips" },
] as const;

type IngredientId = typeof INGREDIENTS[number]["id"];

type Mix = Record<IngredientId, number>;

const preset44x5: Mix = {
  pera: 44,
  almendras: 44,
  nueces: 44,
  uva: 44,
  banana: 44,
};

export function MixBuilder() {
  const [mix, setMix] = useState<Mix>(preset44x5);
  const [mixQty, setMixQty] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<IngredientId>("pera");
  const [deliveryOption, setDeliveryOption] = useState<"ciudad" | "envio">("ciudad");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [cartMix, setCartMix] = useState<Mix | null>(null);
  const [shakeRemaining, setShakeRemaining] = useState(false);

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

  const pricing = useMemo(() => {
    const basePrice = computePrice(mixQty);
    const deliveryCost = deliveryOption === "envio" ? DELIVERY_COST : 0;
    return {
      ...basePrice,
      price: basePrice.price + deliveryCost,
      deliveryCost,
    };
  }, [mixQty, deliveryOption]);

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
                <Badge variant={remaining === 0 ? "default" : "secondary"}>Total: {total}g</Badge>
                <Badge 
                  variant={remaining === 0 ? "secondary" : "default"}
                  className={shakeRemaining ? "animate-shake" : ""}
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
                    onMouseDown={() => startHold(ing.id, -2)}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => startHold(ing.id, -2)}
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
                    onMouseDown={() => startHold(ing.id, +2)}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => startHold(ing.id, +2)}
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
                disabled={!isValid}
                onClick={() => {
                  setCartMix(mix);
                  setMixQty(1);
                  setDeliveryOption("envio");
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
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
              // Paletas por tipo
              const colorById: Record<IngredientId, string> = {
                // Frutas deshidratadas (celestes)
                pera: "#38bdf8",    // sky-400
                uva: "#0ea5e9",     // sky-500
                banana: "#93c5fd",  // blue-300
                // Frutos secos (amarillos)
                almendras: "#f59e0b", // amber-500
                nueces: "#fbbf24",    // amber-400
              }

              const parts = (INGREDIENTS as readonly {id: IngredientId; name: string}[]).map((ing) => ({
                name: ing.name,
                percent: percentages[ing.id] ?? 0,
                color: colorById[ing.id],
              }))
              let acc = 0
              const stops = parts.map(p => {
                const start = acc
                const end = acc + p.percent
                acc = end
                return `${p.color} ${start}% ${end}%`
              }).join(", ")
              const bg = `conic-gradient(${stops})`
              return (
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="size-48 rounded-full shadow-sm border"
                    style={{ background: bg }}
                    aria-label="Gráfico de torta de ingredientes"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {parts.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="ml-auto font-medium">{p.percent}%</span>
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
            {!cartMix ? (
              <div className="text-muted-foreground">No hay mixs en el carrito. Armalo arriba y agregalo.</div>
            ) : (
              <>
                {/* Encabezado del ítem Mix con controles de cantidad */}
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">Mix (220 g)</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => setMixQty((q) => {
                        const newQty = Math.max(0, q - 1);
                        if (newQty === 0) setCartMix(null);
                        return newQty;
                      })}
                      aria-label="Reducir cantidad de mix"
                    >
                      -
                    </Button>
                    <span className="min-w-6 text-center">{mixQty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => setMixQty((q) => q + 1)}
                      aria-label="Aumentar cantidad de mix"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Composición con porcentajes en una sola línea */}
                <div className="text-muted-foreground">
                  ({INGREDIENTS.filter((ing) => (cartMix[ing.id] ?? 0) > 0)
                    .map((ing) => {
                      const cartTotal = Object.values(cartMix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
                      const cartPercent = cartTotal > 0 ? Math.round(((cartMix[ing.id] ?? 0) / cartTotal) * 100) : 0;
                      return `${ing.name} ${cartPercent}%`;
                    })
                    .join(", ")})
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Gramos totales</div>
            <div className="text-right font-medium">{cartMix ? mixQty * TOTAL_GRAMS : 0} g</div>
            <div className="text-muted-foreground">Energía acumulada</div>
            <div className="text-right font-medium">{cartMix ? mixQty : 0} ⚡</div>
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

          {/* Campo de dirección de entrega */}
          <div>
            <label htmlFor="delivery-address" className="text-sm text-muted-foreground block mb-1">
              {deliveryOption === "ciudad" ? "Facultad o lugar de entrega" : "Dirección de entrega"}
            </label>
            <Input
              id="delivery-address"
              type="text"
              placeholder={deliveryOption === "ciudad" ? "Ej: Pabellón Argentina" : "Ej: Av. Valparaíso 1234, Córdoba"}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Precios */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal (sin promo)</span>
              <span className={(pricing.discount > 0 || deliveryOption === "ciudad") ? "line-through text-muted-foreground" : "font-medium text-muted-foreground"}>
                {currency.format(cartMix ? (mixQty * PRICE_SINGLE + DELIVERY_COST) : 0)}
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
              disabled={!cartMix}
              onClick={() => alert(`Ir al checkout con ${mixQty} mix(s) (pendiente)`)}
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
