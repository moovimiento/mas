"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
  const [discountCode, setDiscountCode] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moovimiento_cartItems');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [shakeRemaining, setShakeRemaining] = useState(false);
  const [hoveredIngredient, setHoveredIngredient] = useState<IngredientId | null>(null);
  const cartRef = useRef<HTMLDivElement>(null);

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

  const promoBreakdown = useMemo(() => {
    const qty = totalMixQty;
    const n15 = Math.floor(qty / 15);
    let rem = qty - n15 * 15;
    const n5 = Math.floor(rem / 5);
    rem = rem - n5 * 5;
    const n1 = rem;
    
    const parts: string[] = [];
    if (n15 > 0) parts.push(`${n15 * 15} Mix${n15 * 15 > 1 ? 's' : ''} (${n15} promo${n15 > 1 ? 's' : ''} de 15)`);
    if (n5 > 0) parts.push(`${n5 * 5} Mix${n5 * 5 > 1 ? 's' : ''} (${n5} promo${n5 > 1 ? 's' : ''} de 5)`);
    if (n1 > 0) parts.push(`${n1} Mix${n1 > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(' + ') : '0 Mixs';
  }, [totalMixQty]);

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
    
    // Verificar si el código está en la lista de códigos válidos
    if (!validCodes.includes(upperCode)) {
      return null;
    }
    
    // Extraer número del nombre del código
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
      setDiscountError("Por favor ingrese un código de descuento válido");
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
      setDiscountError("Por favor ingrese un código de descuento válido");
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

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
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        discountAmount = (subtotal * appliedDiscount.value) / 100;
      } else if (appliedDiscount.type === 'fixed') {
        discountAmount = Math.min(appliedDiscount.value, subtotal);
      }
    }
    
    const finalPrice = Math.max(0, subtotal - discountAmount);
    
    return {
      ...basePrice,
      price: finalPrice,
      deliveryCost,
      discountAmount,
      subtotal,
    };
  }, [totalMixQty, deliveryOption, appliedDiscount]);

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
      
      // Round to nearest multiple of 11
      nextVal = Math.round(nextVal / 11) * 11;
      return { ...prev, [id]: nextVal } as Mix;
    });
  }


  function setClassicMix() {
    setMix({
      pera: 44,
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
    return Object.values(mix).every(value => value === 44);
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

  return (
    <div className="mx-auto max-w-5xl px-6 space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <h2 className="text-2xl font-semibold">Armá tu mix (220g)</h2>
        <div className="text-sm text-muted-foreground whitespace-normal flex flex-row justify-between gap-8">
          <span>Mínimo por ingrediente: <span className="font-medium">0g</span></span>
          <span>Máximo por ingrediente: <span className="font-medium">88g</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Card className="h-full flex flex-col" data-card="ingredients">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Ingredientes</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
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
                <div className={cn("font-medium text-center lg:text-left w-full lg:w-auto", ing.id === selectedId && "text-yellow-600")}>{ing.name}</div>
                <div className={cn("flex items-center gap-1 rounded-md w-full lg:w-auto justify-center lg:justify-end")}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer flex-shrink-0"
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
                    disabled={(mix[ing.id] ?? 0) <= 0}
                  >
                    -
                  </Button>
                  <div className="relative flex-shrink-0">
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
                    className="h-8 w-8 cursor-pointer flex-shrink-0"
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
                    disabled={remaining <= 0}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={setClassicMix}
                disabled={isClassicMix}
                className={cn(
                  "!bg-transparent !border-gray-200 !text-white hover:!bg-white/20 hover:!border-gray-300",
                  isClassicMix && "opacity-50 cursor-not-allowed"
                )}
                title={isClassicMix ? "Ya es mix clásico" : "Poner todos los ingredientes en 44g"}
                aria-label="Mix clásico (44g cada ingrediente)"
              >
                Mix clásico (≡)
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
                          ? { ...item, quantity: item.quantity + 1 }
                          : item
                      )
                    );
                  } else {
                    // New mix, add to cart
                    setCartItems((prev) => [...prev, { mix, quantity: 1 }]);
                  }
                  if (cartItems.length === 0) {
                    setDeliveryOption("ciudad");
                  }
                  // Scroll al carrito después de agregar
                  setTimeout(() => {
                    cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
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
      <Card ref={cartRef}>
        <CardHeader>
          <CardTitle>Carrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            {cartItems.length === 0 ? (
              <div className="text-muted-foreground py-6">
                No hay mixs en el carrito 🛒 <button 
                  onClick={() => {
                    const mixTitle = document.querySelector('h2');
                    if (mixTitle) {
                      mixTitle.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-white hover:text-gray-200 cursor-pointer"
                >
                  Armalo arriba y agregalo
                </button>
              </div>
            ) : (
              <>
                {cartItems.map((item, index) => {
                  const itemTotal = Object.values(item.mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
                  return (
                    <div key={index} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-yellow-600 max-w-80 md:max-w-96">Mix de {INGREDIENTS.filter((ing) => (item.mix[ing.id] ?? 0) > 0)
                          .map((ing) => {
                            const percent = itemTotal > 0 ? Math.round(((item.mix[ing.id] ?? 0) / itemTotal) * 100) : 0;
                            return `${ing.name} ${percent}%`;
                          })
                          .join(", ")}</div>
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
                <div className="pt-2 w-full">
                  <button 
                    onClick={() => {
                      const mixTitle = document.querySelector('h2');
                      if (mixTitle) {
                        mixTitle.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="text-white hover:text-gray-200 cursor-pointer text-sm text-left w-full block"
                  >
                    ↑ Volver arriba para agregar un mix con otros ingredientes
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <div className="text-muted-foreground">Cantidad</div>
            <div className="text-right font-medium">{promoBreakdown} <span className="ml-2">📦</span></div>
            <div className="text-muted-foreground">Gramos</div>
            <div className="text-right font-medium">{totalMixQty * TOTAL_GRAMS}g <span className="ml-2">⚡</span></div>
            <div className="text-muted-foreground">Delivery</div>
            <div className="text-right flex items-center justify-end gap-2">
              <button
                onClick={() => setDeliveryOption(deliveryOption === "ciudad" ? "envio" : "ciudad")}
                className="text-sky-500 hover:text-sky-600 transition-colors border border-sky-500 rounded px-1 cursor-pointer flex-shrink-0"
                aria-label="Opción anterior de delivery"
              >
                ←
              </button>
              <span className="whitespace-nowrap text-sky-600">{deliveryOption === "ciudad" ? "Ciudad Universitaria (free)" : "Córdoba ($1000 de envío)"}</span>
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
                title="Este campo es obligatorio"
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
                title="Este campo es obligatorio"
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
                title="Este campo es obligatorio"
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
                title="Por favor ingresa un email válido"
              />
            </div>
          </div>

          {/* Campo de código de descuento */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground block">
              Descuento (opcional)
            </label>
            <div className="flex items-center gap-2 w-full md:w-1/2 md:pr-2">
              <Input
                type="text"
                placeholder="Tu código de descuento"
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
                  Aplicar
                </Button>
              )}
            </div>
            {appliedDiscount && (
              <div className="flex items-center gap-2 text-sm text-white">
                <span>✓</span>
                <span>
                  Código {appliedDiscount.code} aplicado: 
                  {appliedDiscount.type === 'percentage' 
                    ? ` ${appliedDiscount.value}% de descuento`
                    : ` $${appliedDiscount.value} de descuento`
                  }
                </span>
              </div>
            )}
            {discountError && (
              <div className="text-sm text-white">
                {discountError}
              </div>
            )}
          </div>

          {/* Precios */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal (sin promo)</span>
              <span className={(pricing.discount > 0 || deliveryOption === "ciudad" || pricing.discountAmount > 0) ? "line-through text-muted-foreground" : "font-medium text-muted-foreground"}>
                {currency.format(totalMixQty > 0 ? (totalMixQty * PRICE_SINGLE + DELIVERY_COST) : 0)}
              </span>
            </div>
            {(pricing.discount > 0 || deliveryOption === "ciudad") && (
              <div className="flex items-center justify-between">
                <span className="text-green-600">Ahorro por las promos</span>
                <span className="text-green-600">- {currency.format(pricing.discount + (deliveryOption === "ciudad" ? DELIVERY_COST : 0))}</span>
              </div>
            )}
            {pricing.discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-green-600">
                  {appliedDiscount?.type === 'percentage' 
                    ? `Descuento del ${appliedDiscount.value}%`
                    : 'Descuento por código'
                  }
                </span>
                <span className="text-green-600">- {currency.format(pricing.discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="font-medium">
                {deliveryOption === "ciudad" && (pricing.discount > 0 || pricing.discountAmount > 0)
                  ? "Total (con promos y envío gratis)"
                  : deliveryOption === "ciudad"
                  ? "Total (con envío gratis)"
                  : (pricing.discount > 0 || pricing.discountAmount > 0)
                  ? "Total (con descuentos)"
                  : "Total"}
              </span>
              <span className="font-semibold">{currency.format(pricing.price)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              disabled={cartItems.length === 0 || !deliveryAddress.trim() || !phone.trim() || !name.trim() || !isValidEmail}
              onClick={async () => {
                try {
                  // Preparar items para el email
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
                      mix: item.mix,
                      quantity: item.quantity,
                      ingredients
                    };
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
                      items: mixItems,
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
                    setMix({
                      pera: 0,
                      almendras: 0,
                      nueces: 0,
                      uva: 0,
                      banana: 0,
                    });
                  } else {
                    const errorData = await emailResponse.json();
                    console.error('Error del servidor:', errorData);
                    setErrorMessage(`Error al enviar el email: ${errorData.error || 'Error desconocido'}`);
                  }
                } catch (error) {
                  console.error('Error al procesar el pedido:', error);
                  setErrorMessage("Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.");
                }
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500"
            >
              Abonar en efectivo
            </Button>
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
                      discountCode: appliedDiscount?.code || null,
                      discountAmount: pricing.discountAmount,
                    }),
                  });

                  const data = await response.json();

                  if (data.error) {
                    console.error("API Error:", data.error);
                    setErrorMessage(`Error: ${data.error}`);
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
                    setErrorMessage("Error al crear el checkout");
                  }
                } catch (error) {
                  console.error("Error:", error);
                  setErrorMessage("Error al procesar el checkout");
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
            >
              Abonar con Mercado Pago
            </Button>
          </div>
          
          {/* Mensaje de error */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
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
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ¡Pedido confirmado!
            </h2>
            <p className="text-gray-600 mb-6">
              Te contactaremos por WhatsApp para coordinar la entrega y el pago en efectivo.
              <br />
              <strong>Revisá tu email para más detalles.</strong>
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                window.location.reload();
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
