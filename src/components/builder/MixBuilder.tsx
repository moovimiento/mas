"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { dictionary, Language } from "@/lib/dictionary";

const TOTAL_GRAMS = 220;
const MAX_PER_INGREDIENT = 66;
// const MIN_NONZERO = 22;

const INGREDIENTS_BASE = [
  { id: "banana", color: "#a8d8ea" },    // celeste claro argentino
  { id: "almendras", color: "#4fb3d4" }, // celeste argentino
  { id: "nueces", color: "#2a9cc0" },    // celeste medio oscuro
  { id: "uva", color: "#1a7fa0" },       // celeste oscuro
  { id: "durazno", color: "#75c9e0" },   // celeste medio claro
] as const;

type IngredientId = typeof INGREDIENTS_BASE[number]["id"];
// type IngredientBase = typeof INGREDIENTS_BASE[number];

type Mix = Record<IngredientId, number>;

type CartItem = {
  mix: Mix;
  quantity: number;
};

const presetMix: Mix = {
  durazno: 44,
  almendras: 44,
  nueces: 44,
  uva: 44,
  banana: 44,
};

export function MixBuilder({ lang = 'es' }: { lang?: Language }) {
  const t = dictionary[lang];

  const INGREDIENTS = useMemo(() => INGREDIENTS_BASE.map(ing => ({
    ...ing,
    name: t.ingredients[ing.id]
  })), [t]);
  const [mix, setMix] = useState<Mix>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moovimiento_mix');
      // Validate saved mix against current ingredients to avoid crashes
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // If the parsed mix has 'pera' or is missing current ingredients, fallback to default
          // Quick check: if keys don't match INGREDIENTS_BASE ids
          const keys = Object.keys(parsed);
          const validKeys = INGREDIENTS_BASE.map(i => i.id);
          const hasInvalid = keys.some(k => !validKeys.includes(k as IngredientId));
          const missingValid = validKeys.some(k => typeof parsed[k] !== 'number');

          const hasComingSoon = INGREDIENTS_BASE.some(ing => (ing as { comingSoon?: boolean }).comingSoon && parsed[ing.id] > 0);

          const hasUnderMin = false; // logic removed

          if (!hasInvalid && !missingValid && !hasComingSoon && !hasUnderMin && (Object.values(parsed) as number[]).reduce((a, b) => a + b, 0) === 220) {
            return parsed;
          }
        } catch { }
      }
      return presetMix;
    }
    return presetMix;
  });
  const [selectedId, setSelectedId] = useState<IngredientId>("almendras");
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
  const [discountCode, setDiscountCode] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  // removed selectedPaymentMethod state — the web should not show the extra 'Total a pagar' row

  // fetchWithTimeout removed (not used)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moovimiento_cartItems');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  // value intentionally unused; only the setter is used elsewhere. Disable unused-vars lint for the value.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_shakeRemaining, setShakeRemaining] = useState(false);
  const [shakeAddToCart, setShakeAddToCart] = useState(false);
  const [shakeClassicMix, setShakeClassicMix] = useState(false);
  const [hoveredIngredient, setHoveredIngredient] = useState<IngredientId | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const cartRef = useRef<HTMLDivElement>(null);

  const total = useMemo(() => Object.values(mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0), [mix]);
  const remaining = TOTAL_GRAMS - total;
  const isValid = total === TOTAL_GRAMS && INGREDIENTS_BASE.every((ing) => {
    const isComingSoon = (ing as { comingSoon?: boolean }).comingSoon;
    const g = mix[ing.id] ?? 0;
    return g >= 0 && g <= MAX_PER_INGREDIENT;
  });

  const percentages = useMemo(() => {
    return Object.fromEntries(
      (Object.keys(mix) as IngredientId[]).map((id) => [
        id,
        total > 0 ? Math.round(((mix[id] ?? 0) / total) * 100) : 0,
      ])
    ) as Record<IngredientId, number>;
  }, [mix, total]);

  useEffect(() => {
    const handleSetQuantity = (e: Event) => {
      const customEvent = e as CustomEvent<{ quantity: number }>;
      if (customEvent.detail && typeof customEvent.detail.quantity === 'number') {
        setQuantityToAdd(customEvent.detail.quantity);
      }
    };

    window.addEventListener('set-mix-quantity', handleSetQuantity);
    return () => {
      window.removeEventListener('set-mix-quantity', handleSetQuantity);
    };
  }, []);

  // Pricing (ARS): base 4000 per mix; promos -> 5 for 18000, 15 for 53000
  const PRICE_SINGLE = 4000;
  const PRICE_PACK5 = 18000;  // per 5
  const PRICE_PACK10 = 35000; // per 10
  const PRICE_PACK15 = 53000; // per 15
  const DELIVERY_COST = 1000;

  const currency = useMemo(() => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }), []);

  function computePrice(qty: number) {
    // Greedy: maximize 15-packs, then 10-packs, then 5-packs, then singles
    let rem = qty;
    const n15 = Math.floor(rem / 15);
    rem -= n15 * 15;
    const n10 = Math.floor(rem / 10);
    rem -= n10 * 10;
    const n5 = Math.floor(rem / 5);
    rem -= n5 * 5;
    const n1 = rem;

    const price = n15 * PRICE_PACK15 + n10 * PRICE_PACK10 + n5 * PRICE_PACK5 + n1 * PRICE_SINGLE;
    const original = qty * PRICE_SINGLE;
    const discount = original - price;
    return { price, discount, breakdown: { n15, n10, n5, n1 } };
  }

  const totalMixQty = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const promoBreakdown = useMemo(() => {
    const qty = totalMixQty;
    let rem = qty;
    const n15 = Math.floor(rem / 15);
    rem -= n15 * 15;
    const n10 = Math.floor(rem / 10);
    rem -= n10 * 10;
    const n5 = Math.floor(rem / 5);
    rem -= n5 * 5;
    const n1 = rem;

    const parts: string[] = [];
    if (n15 > 0) parts.push(`${n15 * 15} ${t.promo_mixes} (${n15} ${t.promo_promo}${n15 > 1 ? 's' : ''} ${t.promo_of} 15)`);
    if (n10 > 0) parts.push(`${n10 * 10} ${t.promo_mixes} (${n10} ${t.promo_promo}${n10 > 1 ? 's' : ''} ${t.promo_of} 10)`);
    if (n5 > 0) parts.push(`${n5 * 5} ${t.promo_mixes} (${n5} ${t.promo_promo}${n5 > 1 ? 's' : ''} ${t.promo_of} 5)`);
    if (n1 > 0) parts.push(`${n1} ${t.promo_mixes}`);

    return parts.length > 0 ? parts.join(' + ') : `0 ${t.promo_mixes}`;
  }, [totalMixQty, t]);

  const isValidEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  // Función para validar códigos de descuento
  const validateDiscountCode = (code: string) => {
    const upperCode = code.toUpperCase();
    // Obtener códigos válidos desde variables de entorno
    const validCodesEnv = process.env.NEXT_PUBLIC_DISCOUNT_CODES || '';
    const validCodes = validCodesEnv.split(',').map(c => c.trim()).filter(c => c);

    // Si el código no está en la lista, no es válido
    if (!validCodes.includes(upperCode)) {
      return null;
    }

    // Primero, intentar mapa explícito (NEXT_PUBLIC_DISCOUNT_MAP) para casos especiales
    const mapEnv = process.env.NEXT_PUBLIC_DISCOUNT_MAP || '';
    if (mapEnv) {
      try {
        const parsed = JSON.parse(mapEnv) as Record<string, { type: 'percentage' | 'fixed'; value: number }>;
        const mapped = parsed[upperCode];
        if (mapped && (mapped.type === 'percentage' || mapped.type === 'fixed') && typeof mapped.value === 'number') {
          return {
            type: mapped.type,
            value: mapped.value,
            description: mapped.type === 'percentage' ? `${mapped.value}% de descuento` : `$${mapped.value.toLocaleString('es-AR')} de descuento`,
          } as const;
        }
      } catch {
        // ignore parse errors and fall back to heuristic
      }
    }

    // Fallback heurística (como antes): extraer número del final y decidir porcentaje o fijo
    const numberMatch = upperCode.match(/(\d+)$/);
    if (numberMatch) {
      const number = parseInt(numberMatch[1]);
      const digits = numberMatch[1].length;

      // Si tiene 1-2 dígitos: porcentaje
      if (digits <= 2 && number > 0 && number <= 100) {
        return {
          type: 'percentage' as const,
          value: number,
          description: `${number}% de descuento`
        };
      }

      // Si tiene 3-5 dígitos: descuento fijo en pesos
      if (digits >= 3 && digits <= 5 && number > 0) {
        return {
          type: 'fixed' as const,
          value: number,
          description: `$${number.toLocaleString('es-AR')} de descuento`
        };
      }
    }

    // Si no tiene número válido, el código no es válido
    return null;
  };

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountError(t.discount_invalid);
      return;
    }

    const discount = validateDiscountCode(discountCode);
    if (discount) {
      setAppliedDiscount({
        code: discountCode.toUpperCase(),
        type: discount.type,
        value: discount.value,
      });
      setDiscountError("");
    } else {
      setDiscountError(t.discount_invalid);
    }
  };

  // handleRemoveDiscount removed (not used)

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
    const subtotal = basePrice.price + deliveryCost;

    // Aplicar descuento si existe
    let discountAmount = 0;
    let discountCapped = false;
    if (appliedDiscount) {
      let raw = 0;
      if (appliedDiscount.type === 'percentage') {
        raw = (subtotal * appliedDiscount.value) / 100;
      } else if (appliedDiscount.type === 'fixed') {
        raw = Math.min(appliedDiscount.value, subtotal);
      }
      // Aplicar tope máximo para códigos de descuento (ej: 787 -> $787)
      const DISCOUNT_CAP = 787;
      if (raw > DISCOUNT_CAP) {
        discountAmount = DISCOUNT_CAP;
        discountCapped = true;
      } else {
        discountAmount = raw;
      }
    }

    const finalPrice = Math.max(0, subtotal - discountAmount);

    return {
      ...basePrice,
      price: finalPrice,
      deliveryCost,
      discountAmount,
      discountCapped,
      subtotal,
    };
  }, [totalMixQty, deliveryOption, appliedDiscount]);

  // Etiqueta legible para el descuento aplicado (porcentaje o monto), preferimos el mapa explícito si existe
  const appliedDiscountLabel = useMemo(() => {
    if (!appliedDiscount) return '';
    const mapEnv = process.env.NEXT_PUBLIC_DISCOUNT_MAP || '';
    if (mapEnv) {
      try {
        const parsed = JSON.parse(mapEnv) as Record<string, { type: 'percentage' | 'fixed'; value: number }>;
        const mapped = parsed[appliedDiscount.code.toUpperCase()];
        if (mapped) {
          if (mapped.type === 'percentage') return `${mapped.value}% de descuento`;
          if (mapped.type === 'fixed') return `$${mapped.value.toLocaleString('es-AR')} de descuento`;
        }
      } catch {
        // ignore
      }
    }
    // fallback al valor tal cual
    return appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}% de descuento` : `$${appliedDiscount.value} de descuento`;
  }, [appliedDiscount]);

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

      const ing = INGREDIENTS_BASE.find(i => i.id === id);
      const isComingSoon = (ing as { comingSoon?: boolean })?.comingSoon;
      const minAllowed = 0;

      let nextVal = Math.min(desiredEven, maxAllowedEven, perIngredientEven);
      if (nextVal < minAllowed) nextVal = minAllowed;
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

      const ing = INGREDIENTS_BASE.find(i => i.id === id);
      const isComingSoon = (ing as { comingSoon?: boolean })?.comingSoon;
      const minAllowed = 0;

      let nextVal = Math.max(minAllowed, Math.min(desiredEven, maxAllowedEven, perIngredientEven));

      // Trigger shake animation if trying to add but no space
      if (delta > 0 && nextVal === current && maxAllowedEven === 0) {
        setShakeRemaining(true);
        setTimeout(() => setShakeRemaining(false), 500);
      }

      // Round to nearest multiple of 11
      nextVal = Math.round(nextVal / 11) * 11;
      return { ...prev, [id]: nextVal } as Mix;
    });
  }


  function setClassicMix() {
    setMix({
      durazno: 44,
      almendras: 44,
      nueces: 44,
      uva: 44,
      banana: 44,
    });
    // Quitar focus de cualquier input activo
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  const isClassicMix = useMemo(() => {
    return mix.durazno === 44 && mix.almendras === 44 && mix.nueces === 44 && mix.uva === 44 && mix.banana === 44;
  }, [mix]);

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

  // Efecto para shake del botón "Agregar al carrito" cuando está válido
  useEffect(() => {
    if (isValid && !shakeAddToCart) {
      const shakeInterval = setInterval(() => {
        setShakeAddToCart(true);
        setTimeout(() => setShakeAddToCart(false), 500);
      }, 5000); // Shake cada 5 segundos

      return () => clearInterval(shakeInterval);
    }
  }, [isValid, shakeAddToCart]);

  // Efecto para shake del botón "Mix clásico" cuando está habilitado y agregar al carrito no
  useEffect(() => {
    if (!isClassicMix && !isValid && !shakeClassicMix) {
      const shakeInterval = setInterval(() => {
        setShakeClassicMix(true);
        setTimeout(() => setShakeClassicMix(false), 500);
      }, 5000); // Shake cada 5 segundos

      return () => clearInterval(shakeInterval);
    }
  }, [isClassicMix, isValid, shakeClassicMix]);

  return (
    <div className="mx-auto max-w-5xl px-6 space-y-6 pb-8">
      <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-1 text-center md:text-left">
        <h2 className="hidden md:block text-2xl font-semibold">{t.builder_title}</h2>
        <div className="text-sm text-muted-foreground whitespace-normal flex flex-col items-center sm:flex-row sm:justify-between gap-0 sm:gap-8 pt-2 leading-tight">
          <span>{t.max_per_ingredient}: <span className="font-medium">66g</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Card className="h-full flex flex-col" data-card="ingredients">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{t.card_ingredients_title}</CardTitle>
              <div className="flex items-center gap-2">
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    if (total < 220) {
                      setClassicMix();
                    }
                  }}
                >
                  <div className="w-24 h-6 bg-gray-300 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 ease-out"
                      style={{
                        width: `${Math.min((total / 220) * 100, 100)}%`,
                        background: total === 220 ? 'linear-gradient(to right, #22c55e, #16a34a)' : // verde total solo en 220g
                          total < 55 ? 'linear-gradient(to right, #ef4444, #f97316)' : // rojo a naranja (0-25%)
                            total < 110 ? 'linear-gradient(to right, #f97316, #eab308)' : // naranja a amarillo (25-50%)
                              total < 165 ? 'linear-gradient(to right, #eab308, #facc15)' : // amarillo más intenso (50-75%)
                                'linear-gradient(to right, #eab308, #22c55e)' // amarillo a verde (75-99%)
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                    {total}/220g
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {INGREDIENTS.map((ing) => (
              <div key={ing.id} className="flex flex-col lg:grid lg:grid-cols-[1fr_auto] items-center gap-2 lg:gap-3">
                <div
                  className={cn(
                    "font-medium text-center lg:text-left w-full lg:w-auto cursor-pointer transition-all",
                    (mix[ing.id] ?? 0) === 0 && "opacity-40"
                  )}
                  style={{
                    color: (mix[ing.id] ?? 0) === 0 ? undefined : (ing.id === selectedId ? '#eab308' : ing.color)
                  }}
                  onClick={() => setSelectedId(ing.id)}
                >
                  {ing.name}
                </div>
                <div className={cn("flex items-center gap-1 rounded-md w-full lg:w-auto justify-center lg:justify-end")}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-8 w-8 cursor-pointer flex-shrink-0 transition-all",
                      (mix[ing.id] ?? 0) === 0 && "opacity-40"
                    )}
                    onMouseDown={() => {
                      setSelectedId(ing.id);
                      startHold(ing.id, -11);
                    }}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => {
                      setSelectedId(ing.id);
                      startHold(ing.id, -11);
                    }}
                    onTouchEnd={stopHold}
                    onTouchCancel={stopHold}
                    aria-label={`Restar 11 gramos a ${ing.name}`}
                    disabled={(mix[ing.id] ?? 0) <= 0 || (ing as { comingSoon?: boolean }).comingSoon}
                  >
                    -
                  </Button>
                  <div className={cn(
                    "relative flex-shrink-0 transition-opacity",
                    (mix[ing.id] ?? 0) === 0 && "opacity-40"
                  )}>
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="number"
                      min={0}
                      max={MAX_PER_INGREDIENT}
                      value={mix[ing.id] ?? 0}
                      onChange={(e) => setGram(ing.id, Number(e.target.value))}
                      onFocus={() => setSelectedId(ing.id)}
                      disabled={(ing as { comingSoon?: boolean }).comingSoon}
                      readOnly
                      className="w-24 pr-6 text-right cursor-default"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">g</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-8 w-8 cursor-pointer flex-shrink-0 transition-colors"
                    )}
                    style={remaining > 0 && (mix[ing.id] ?? 0) < MAX_PER_INGREDIENT && !(ing as { comingSoon?: boolean }).comingSoon ? {
                      borderColor: '#eab308',
                      color: '#eab308',
                      backgroundColor: '#eab30815'
                    } : undefined}
                    onMouseDown={() => {
                      setSelectedId(ing.id);
                      startHold(ing.id, +11);
                    }}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={() => {
                      setSelectedId(ing.id);
                      startHold(ing.id, +11);
                    }}
                    onTouchEnd={stopHold}
                    onTouchCancel={stopHold}
                    aria-label={`Sumar 11 gramos a ${ing.name}`}
                    disabled={remaining <= 0 || (mix[ing.id] ?? 0) >= MAX_PER_INGREDIENT || (ing as { comingSoon?: boolean }).comingSoon}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-4 pb-6 lg:py-4 mt-2 mb-4 lg:mb-2 border-t border-b border-border/60">
              <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto] items-center gap-2 lg:gap-3">
                <div className="font-medium text-center lg:text-left w-full lg:w-auto text-muted-foreground">
                  {t.label_quantity}
                </div>
                <div className="flex items-center gap-1 w-full lg:w-auto justify-center lg:justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                    disabled={quantityToAdd <= 1}
                  >
                    -
                  </Button>
                  <div className="relative flex-shrink-0">
                    <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">x</span>
                    <Input
                      type="number"
                      min={1}
                      value={quantityToAdd}
                      onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                      readOnly
                      className="w-24 pl-6 text-center h-8 cursor-default"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={setClassicMix}
                disabled={isClassicMix}
                className={cn(
                  "!bg-transparent !border-gray-200 !text-foreground hover:!bg-muted/20 hover:!border-gray-300",
                  isClassicMix && "opacity-50 cursor-not-allowed",
                  shakeClassicMix && "animate-wiggle"
                )}
                title={isClassicMix ? t.classic_mix_already : t.classic_mix_tooltip}
                aria-label={t.classic_mix_tooltip}
              >
                {t.classic_mix_btn}
              </Button>
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
                          ? { ...item, quantity: item.quantity + quantityToAdd }
                          : item
                      )
                    );
                  } else {
                    // New mix, add to cart
                    setCartItems((prev) => [...prev, { mix, quantity: quantityToAdd }]);
                  }
                  if (cartItems.length === 0) {
                    setDeliveryOption("ciudad");
                  }
                  // Reset quantity
                  setQuantityToAdd(1);
                  // Scroll al carrito después de agregar
                  setTimeout(() => {
                    cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className={cn(
                  "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 lg:mr-3 cursor-pointer",
                  !isValid && "opacity-50",
                  shakeAddToCart && isValid && "animate-wiggle"
                )}
                title={!isValid ? t.complete_remaining.replace('{g}', remaining.toString()) : ""}
                aria-label={!isValid ? t.complete_remaining.replace('{g}', remaining.toString()) : t.add_to_cart}
              >
                {t.add_to_cart}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader className="items-center text-center">
            <CardTitle>{t.distribution_title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col items-center justify-center lg:justify-start lg:pt-2">
            {/** Pie chart usando conic-gradient dinámico **/}
            {(() => {
              // Usar colores de INGREDIENTS
              const colorById: Record<IngredientId, string> = Object.fromEntries(
                INGREDIENTS.map(ing => [ing.id, ing.color])
              ) as Record<IngredientId, string>

              const parts = (INGREDIENTS as readonly { id: IngredientId; name: string }[]).map((ing) => ({
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
                const isSelected = hoveredIngredient ? p.id === hoveredIngredient : p.id === selectedId
                const color = isSelected ? '#eab308' : p.color
                return `${color} ${p.startAngle / 3.6}% ${p.endAngle / 3.6}%`
              }).join(", ")
              const bg = `conic-gradient(${stops})`

              return (
                <div className="flex flex-col items-center gap-4 lg:gap-10">
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
                  <div className="grid grid-cols-1 gap-y-2 text-sm w-full max-w-[240px]">
                    {parts.map((p, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer transition-all"
                        )}
                        onMouseEnter={() => setSelectedId(p.id)}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <span
                          className={cn("inline-block size-3 rounded-sm flex-shrink-0", (mix[p.id] ?? 0) === 0 && "opacity-40 bg-muted-foreground")}
                          style={(mix[p.id] ?? 0) > 0 ? { backgroundColor: p.id === selectedId ? '#eab308' : p.color } : undefined}
                        />
                        <span
                          className={cn("flex-1 whitespace-nowrap", (mix[p.id] ?? 0) === 0 && "text-muted-foreground opacity-40")}
                          style={(mix[p.id] ?? 0) > 0 ? { color: p.id === selectedId ? '#eab308' : p.color } : undefined}
                        >
                          {p.name}
                        </span>
                        <span
                          className={cn("ml-2 min-w-[2.5rem] text-right flex-shrink-0", (mix[p.id] ?? 0) === 0 && "text-muted-foreground opacity-40")}
                          style={(mix[p.id] ?? 0) > 0 ? { color: p.id === selectedId ? '#eab308' : p.color } : undefined}
                        >
                          {p.percent}%
                        </span>
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
      <Card ref={cartRef}>
        <CardHeader>
          <CardTitle>{t.cart_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            {cartItems.length === 0 ? (
              <div className="text-muted-foreground py-5 border-t border-b border-border/80">
                {t.cart_empty} <button
                  onClick={() => {
                    const mixTitle = document.querySelector('h2');
                    if (mixTitle) {
                      mixTitle.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-foreground hover:text-muted-foreground cursor-pointer"
                >
                  {t.cart_build_link}
                </button>
              </div>
            ) : (
              <>
                {cartItems.map((item, index) => {
                  const itemTotal = Object.values(item.mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

                  // Función para determinar si un ingrediente difiere de otros Mixes
                  const getIngredientDifferences = () => {
                    const differences = new Set<string>();

                    // Comparar con todos los otros Mixes
                    cartItems.forEach((otherItem, otherIndex) => {
                      if (otherIndex !== index) {
                        const otherTotal = Object.values(otherItem.mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

                        INGREDIENTS.forEach((ing) => {
                          const currentPercent = itemTotal > 0 ? Math.round(((item.mix[ing.id] ?? 0) / itemTotal) * 100) : 0;
                          const otherPercent = otherTotal > 0 ? Math.round(((otherItem.mix[ing.id] ?? 0) / otherTotal) * 100) : 0;

                          if (currentPercent !== otherPercent) {
                            differences.add(ing.id);
                          }
                        });
                      }
                    });

                    return differences;
                  };

                  const differentIngredients = getIngredientDifferences();

                  return (
                    <div key={index} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-yellow-600 max-w-80 md:max-w-96">{t.mix_composed_of} {INGREDIENTS.filter((ing) => (item.mix[ing.id] ?? 0) > 0)
                          .map((ing) => {
                            const percent = itemTotal > 0 ? Math.round(((item.mix[ing.id] ?? 0) / itemTotal) * 100) : 0;
                            const isDifferent = differentIngredients.has(ing.id);
                            const text = `${percent}% ${t.mix_percent_of} ${ing.name}`;
                            return (
                              <span key={ing.id}>
                                {isDifferent ? <strong className="text-yellow-400">{text}</strong> : text}
                              </span>
                            );
                          })
                          .map((node, i) => (i === 0 ? node : [' + ', node]))
                          .flat() as React.ReactNode[]}</div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-yellow-500 hover:text-yellow-600 transition-colors border border-yellow-500 rounded"
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
                          <span className="min-w-6 text-center text-yellow-600 font-medium">x {item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-yellow-500 hover:text-yellow-600 transition-colors border border-yellow-500 rounded"
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
                    </div>
                  );
                })}
                <div className="pt-2 pb-3 border-b w-full" style={{ paddingBottom: '1.25rem' }}>
                  <button
                    onClick={() => {
                      const mixTitle = document.querySelector('h2');
                      if (mixTitle) {
                        mixTitle.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="text-foreground hover:text-muted-foreground cursor-pointer text-sm text-left w-full block"
                  >
                    {t.back_to_top}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <div className="text-muted-foreground">{t.label_quantity}</div>
            <div className="text-right font-medium">{promoBreakdown} <span className="ml-2">📦</span></div>
            <div className="text-muted-foreground">{t.label_grams}</div>
            <div className="text-right font-medium">{totalMixQty * TOTAL_GRAMS}g <span className="ml-2">⚡</span></div>
            <div className="text-muted-foreground">{t.label_delivery}</div>
            <div className="text-right flex items-center justify-end gap-2">
              <button
                onClick={() => setDeliveryOption(deliveryOption === "ciudad" ? "envio" : "ciudad")}
                className="text-sky-500 hover:text-sky-600 transition-colors border border-sky-500 rounded px-1 cursor-pointer flex-shrink-0"
                aria-label="Opción anterior de delivery"
              >
                ←
              </button>
              <span className="whitespace-nowrap text-sky-600">{deliveryOption === "ciudad" ? t.delivery_compact_pickup : t.delivery_compact_shipping.replace('${price}', DELIVERY_COST.toString())}</span>
              <button
                onClick={() => setDeliveryOption(deliveryOption === "ciudad" ? "envio" : "ciudad")}
                className="text-sky-500 hover:text-sky-600 transition-colors border border-sky-500 rounded px-1 cursor-pointer flex-shrink-0"
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
                {deliveryOption === "ciudad" ? t.delivery_label_pickup : t.delivery_label_shipping} <span className="text-red-500">*</span>
              </label>
              <Input
                id="delivery-address"
                type="text"
                placeholder={deliveryOption === "ciudad" ? t.delivery_placeholder_pickup : t.delivery_placeholder_shipping}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full"
                required
                title="Este campo es obligatorio"
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm text-muted-foreground block mb-1">
                {t.label_phone_contact} <span className="text-red-500">*</span>
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder={t.placeholder_phone_contact}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full"
                required
                title="Este campo es obligatorio"
              />
            </div>
          </div>

          {/* Campos de nombre y email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="text-sm text-muted-foreground block mb-1">
                {t.label_name} <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder={t.placeholder_name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                required
                title="Este campo es obligatorio"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm text-muted-foreground block mb-1">
                {t.label_email} <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t.placeholder_email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
                title="Por favor ingresa un email válido"
              />
            </div>
          </div>

          {/* Campo de código de descuento */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground block">
              {t.discount_title}
            </label>
            <div className="flex items-center gap-2 w-full md:w-1/2 md:pr-2">
              <Input
                type="text"
                placeholder={t.discount_placeholder}
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value);
                  setDiscountError("");
                }}
                className="flex-1"
                disabled={!!appliedDiscount}
              />
              {!appliedDiscount && (
                <Button
                  variant="outline"
                  onClick={handleApplyDiscount}
                  disabled={!discountCode.trim()}
                  className="whitespace-nowrap"
                >
                  {t.discount_apply}
                </Button>
              )}
            </div>
            {appliedDiscount && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <span>✓</span>
                <span>
                  Código {appliedDiscount.code} aplicado: {appliedDiscountLabel || (appliedDiscount.type === 'percentage' ? ` ${appliedDiscount.value}% de descuento` : ` $${appliedDiscount.value} de descuento`)}
                </span>
              </div>
            )}
            {discountError && (
              <div className="text-sm text-destructive">
                {discountError}
              </div>
            )}
          </div>

          {/* Precios */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t.subtotal_no_promo}</span>
              <span className={(pricing.discount > 0 || deliveryOption === "ciudad" || pricing.discountAmount > 0) ? "line-through text-muted-foreground" : "font-medium text-muted-foreground"}>
                {currency.format(totalMixQty > 0 ? (totalMixQty * PRICE_SINGLE + DELIVERY_COST) : 0)}
              </span>
            </div>
            {deliveryOption === "ciudad" && (
              <div className="flex items-center justify-between">
                <span className="text-green-600 whitespace-nowrap">{t.savings_free_shipping}</span>
                <span className="text-green-600 whitespace-nowrap">- {currency.format(DELIVERY_COST)}</span>
              </div>
            )}
            {pricing.discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-green-600">
                  {appliedDiscount?.type === 'percentage'
                    ? t.savings_discount_percentage.replace('{value}', appliedDiscount.value.toString())
                    : t.savings_discount_code
                  }
                  {pricing.discountCapped ? ' (tope alcanzado)' : ''}
                </span>
                <span className="text-green-600 whitespace-nowrap">- {currency.format(pricing.discountAmount)}</span>
              </div>
            )}
            {pricing.discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-green-600">{t.savings_promos}</span>
                <span className="text-green-600 whitespace-nowrap">- {currency.format(pricing.discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 mt-3 border-t-2 border-border">
              <span className="font-medium">
                {t.total_to_pay}
              </span>
              <span className="font-semibold">{currency.format(pricing.price)}</span>
            </div>
          </div>

          {/* Aviso de mínimo de 5 mixes */}
          {totalMixQty > 0 && totalMixQty < 5 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {t.min_mixes_required.replace('{qty}', totalMixQty.toString())}
            </div>
          )}

          {/* Removed web-only 'Total a pagar' extra row per UX request */}



          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <Button
              disabled={cartItems.length === 0 || totalMixQty < 5 || !deliveryAddress.trim() || !phone.trim() || !name.trim() || !isValidEmail}
              title={totalMixQty > 0 && totalMixQty < 5 ? t.min_mixes_required.replace('{qty}', totalMixQty.toString()) : ""}
              onClick={async () => {
                // proceed with cash flow
                try {
                  // Preparar items para el email
                  const mixItems = cartItems.map((item) => {
                    const itemTotal = Object.values(item.mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
                    const ingredients = INGREDIENTS
                      .filter((ing) => (item.mix[ing.id] ?? 0) > 0)
                      .map((ing) => {
                        const percent = itemTotal > 0 ? Math.round(((item.mix[ing.id] ?? 0) / itemTotal) * 100) : 0;
                        const grams = Math.round((percent / 100) * TOTAL_GRAMS);
                        return `${percent}% de ${ing.name} (${grams}g)`;
                      })
                      .join(" + ");

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
                      unit_price: DELIVERY_COST,
                    });
                  }

                  // If there are promo-based savings (packs) or a discount code, add them as negative items
                  // so that an on-demand Mercado Pago preference (created later from the saved order) matches the email total.
                  if (pricing.discount > 0) {
                    items.push({
                      title: `Ahorro por promos`,
                      quantity: 1,
                      unit_price: -Math.round(pricing.discount),
                    });
                  }
                  if (pricing.discountAmount > 0) {
                    items.push({
                      title: `Descuento ${appliedDiscount?.code ? `(${appliedDiscount.code})` : ''}`,
                      quantity: 1,
                      unit_price: -Math.round(pricing.discountAmount),
                    });
                  }

                  // Debug: verificar datos de descuento
                  console.log('Datos de descuento:', {
                    appliedDiscount,
                    discountAmount: pricing.discountAmount,
                    discountCode: appliedDiscount?.code
                  });

                  // Enviar email de confirmación para pago en efectivo
                  const emailResponse = await fetch('/api/send-order-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      name,
                      email,
                      phone,
                      items: items,
                      deliveryOption,
                      deliveryAddress,
                      totalPrice: pricing.price,
                      totalMixQty: cartItems.reduce((sum, item) => sum + item.quantity, 0),
                      paymentMethod: 'efectivo',
                      discountCode: appliedDiscount?.code || null,
                      discountAmount: pricing.discountAmount || 0,
                    }),
                  });

                  if (emailResponse.ok) {
                    setErrorMessage(""); // Limpiar errores previos
                    setShowSuccessModal(true);
                    // Limpiar carrito después del envío exitoso
                    setCartItems([]);
                    // Limpiar descuento aplicado
                    setAppliedDiscount(null);
                    setDiscountCode("");
                    setDiscountError("");
                    // Setear mix clásico
                    setMix({
                      durazno: 44,
                      almendras: 44,
                      nueces: 44,
                      uva: 44,
                      banana: 44,
                    });
                  } else {
                    const errorData = await emailResponse.json();
                    console.error('Error del servidor:', errorData);
                    setErrorMessage("Hubo un error: Por favor intente nuevamente más tarde");
                  }
                } catch (error) {
                  console.error('Error al procesar el pedido:', error);

                  // Detectar errores de red específicos
                  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                    setErrorMessage("Error de conexión. Verifica tu internet e intenta nuevamente.");
                  } else {
                    setErrorMessage("Hubo un error: Por favor intente nuevamente más tarde");
                  }
                }
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500"
            >
              {t.pay_cash}
            </Button>
            <Button
              disabled={cartItems.length === 0 || totalMixQty < 5 || !deliveryAddress.trim() || !phone.trim() || !name.trim() || !isValidEmail}
              title={totalMixQty > 0 && totalMixQty < 5 ? t.min_mixes_required.replace('{qty}', totalMixQty.toString()) : ""}
              onClick={async () => {
                // proceed with Mercado Pago flow
                try {
                  // Calcular precio con promos aplicadas correctamente
                  const totalMixQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                  // Reuse computePrice to calculate promo price per total quantity (handles packs de 15/5 y unidades)
                  const computed = computePrice(totalMixQty);
                  const precioConPromo = computed.price;
                  const precioUnitarioConPromo = totalMixQty > 0 ? precioConPromo / totalMixQty : PRICE_SINGLE;

                  // Preparar items para Mercado Pago
                  const mixItems = cartItems.map((item) => {
                    const itemTotal = Object.values(item.mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
                    const ingredients = INGREDIENTS
                      .filter((ing) => (item.mix[ing.id] ?? 0) > 0)
                      .map((ing) => {
                        const percent = itemTotal > 0 ? Math.round(((item.mix[ing.id] ?? 0) / itemTotal) * 100) : 0;
                        const grams = Math.round((percent / 100) * TOTAL_GRAMS);
                        return `${percent}% de ${ing.name} (${grams}g)`;
                      })
                      .join(" + ");

                    return {
                      title: `Mix personalizado (${ingredients})`,
                      quantity: item.quantity,
                      unit_price: precioUnitarioConPromo,
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
                      discountCode: appliedDiscount?.code || null,
                      discountAmount: pricing.discountAmount,
                    }),
                  });

                  const data = await response.json();

                  if (data.error) {
                    console.error("API Error:", data.error);
                    setErrorMessage("Hubo un error: Por favor intente nuevamente más tarde");
                    return;
                  }

                  if (data.init_point) {
                    setErrorMessage(""); // Limpiar errores previos
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
                        discountCode: appliedDiscount?.code || null,
                        discountAmount: pricing.discountAmount,
                      }),
                    });

                    // Redirigir a Mercado Pago con locale configurado
                    const checkoutUrl = new URL(data.init_point);
                    checkoutUrl.searchParams.set('locale', 'es-AR');
                    window.location.href = checkoutUrl.toString();
                  } else {
                    setErrorMessage("Hubo un error: Por favor intente nuevamente más tarde");
                  }
                } catch (error) {
                  console.error("Error:", error);

                  // Detectar errores de red específicos
                  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                    setErrorMessage("Error de conexión. Verifica tu internet e intenta nuevamente.");
                  } else {
                    setErrorMessage("Hubo un error: Por favor intente nuevamente más tarde");
                  }
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
            >
              {t.pay_mercadopago}
            </Button>
          </div>

          {/* Mensaje de error */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-transparent border border-red-400 text-red-700 rounded">
              {errorMessage}
              <button
                onClick={() => setErrorMessage("")}
                className="ml-2 text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de éxito para pago en efectivo */}
      {
        showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl border border-white/20">
              {/* Botón X en la esquina superior derecha */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Limpiar carrito y setear mix clásico
                  setCartItems([]);
                  // Limpiar descuento aplicado
                  setAppliedDiscount(null);
                  setDiscountCode("");
                  setDiscountError("");
                  setMix({
                    durazno: 44,
                    almendras: 44,
                    nueces: 44,
                    uva: 44,
                    banana: 44,
                  });
                  window.scrollTo(0, 0);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {t.order_confirmed}
              </h2>
              <p className="text-gray-600 mb-6 whitespace-pre-line">
                {t.order_confirmed_body}
              </p>

              {/* Botón principal de WhatsApp */}
              <a
                href="https://wa.me/5493513239624?text=Hola!%20Confirmo%20mi%20pedido%20personalizado%20de%20Mix(s)%20de%20Frutos%20Secos%20y%20quiero%20coordinar%20la%20entrega%20y%20pago%20en%20efectivo.%20Gracias!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors mb-4 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
                {t.whatsapp_button}
              </a>
              {/* Botón alternativo para abrir Gmail (misma altura/estilo para consistencia) */}
              <a
                href={"https://mail.google.com/mail/u/0/#inbox"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold transition-colors mb-4 ml-3 cursor-pointer"
              >
                <span className="text-lg">✉️</span>
                {t.open_gmail}
              </a>
            </div>
          </div>
        )
      }
    </div >
  );
}
