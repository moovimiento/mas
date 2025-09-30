"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutFailure() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente después de 2 segundos
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-sky-600">Pago rechazado</h1>
        <p className="text-muted-foreground">
          Redirigiendo... Tus datos se guardaron para que puedas intentar nuevamente.
        </p>
      </div>
    </div>
  );
}
