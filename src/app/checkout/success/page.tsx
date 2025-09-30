import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutSuccess() {
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
            Recibirás un email con los detalles de tu compra y el seguimiento del envío.
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
