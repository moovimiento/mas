"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TOTAL_GRAMS = 220;

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

const preset4x55: Mix = {
  pera: 55,
  almendras: 55,
  nueces: 55,
  uva: 55,
  banana: 0,
};

export default function BuilderPage() {
  const [mix, setMix] = useState<Mix>(preset44x5);

  const total = useMemo(() => Object.values(mix).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0), [mix]);
  const remaining = TOTAL_GRAMS - total;
  const isValid = total === TOTAL_GRAMS && Object.values(mix).every((g) => g >= 0 && g <= TOTAL_GRAMS);

  function setGram(id: IngredientId, grams: number) {
    setMix((prev) => ({ ...prev, [id]: Math.max(0, Math.min(TOTAL_GRAMS, Math.round(grams))) }));
  }

  function applyPreset(preset: Mix) {
    setMix(preset);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Armá tu mix (220g)</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => applyPreset(preset44x5)}>Preset 44g x 5</Button>
          <Button variant="outline" onClick={() => applyPreset(preset4x55)}>Preset 4 x 55g</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {INGREDIENTS.map((ing) => (
            <div key={ing.id} className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
              <div className="font-medium">{ing.name}</div>
              <div className="md:col-span-2 flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="number"
                  min={0}
                  max={TOTAL_GRAMS}
                  value={mix[ing.id] ?? 0}
                  onChange={(e) => setGram(ing.id, Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">g</span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant={remaining === 0 ? "default" : "secondary"}>Total: {total}g</Badge>
              <Badge variant={remaining === 0 ? "secondary" : "default"}>Restan: {remaining}g</Badge>
            </div>
            {!isValid && (
              <span className="text-sm text-red-600">El total debe ser exactamente {TOTAL_GRAMS}g.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => setMix(preset44x5)}>Reiniciar</Button>
        <Button disabled={!isValid} onClick={() => alert("Agregar al carrito (pendiente)")}>Agregar al carrito</Button>
      </div>
    </div>
  );
}
