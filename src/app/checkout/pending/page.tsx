import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutPending() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-yellow-600">
            Pago pendiente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Tu pago está siendo procesado.
          </p>
          <p className="text-sm text-muted-foreground">
            Te notificaremos por email cuando se confirme el pago.
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
