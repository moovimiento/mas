"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutSuccess() {
  useEffect(() => {
    // Enviar email de confirmación cuando el usuario llegue a esta página
    const sendConfirmationEmail = async () => {
      try {
        // Obtener datos del localStorage
        const name = localStorage.getItem('moovimiento_name') || '';
        const email = localStorage.getItem('moovimiento_email') || '';
        const phone = localStorage.getItem('moovimiento_phone') || '';
        const deliveryAddress = localStorage.getItem('moovimiento_deliveryAddress') || '';
        const deliveryOption = localStorage.getItem('moovimiento_deliveryOption') || 'ciudad';

        if (email && phone) {
          await fetch('/api/send-payment-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              phone,
              deliveryAddress,
              deliveryOption: deliveryOption.replace(/"/g, ''),
            }),
          });
        }
      } catch (error) {
        console.error('Error sending confirmation email:', error);
      }
    };

    sendConfirmationEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-green-600">
            ¡Pago exitoso! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Tu pedido ha sido confirmado y está siendo preparado.
          </p>
          <p className="text-sm text-muted-foreground">
            Recibirás un email con los detalles de tu compra y las instrucciones para coordinar la entrega.
          </p>
          <Link href="/">
            <Button className="w-full bg-yellow-500 hover:bg-yellow-600">
              Volver al inicio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
