import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutFailure() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-red-600">
            Pago rechazado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Hubo un problema al procesar tu pago.
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, intentá nuevamente o usá otro método de pago.
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
