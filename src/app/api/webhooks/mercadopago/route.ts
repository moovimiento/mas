import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Endpoint para recibir notificaciones de Mercado Pago
// Se puede configurar MERCADOPAGO_WEBHOOK_SECRET en .env para verificar la firma

export async function POST(request: NextRequest) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  try {
    const raw = await request.text();
    const body = raw ? JSON.parse(raw) : {};

    // Verificación HMAC-SHA256 si existe secret
    if (secret) {
      const signature = request.headers.get("x-hub-signature") || request.headers.get("x-hub-signature") || "";
      if (!signature) {
        console.warn("Mercado Pago webhook: signature header missing");
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }

      const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
      if (expected !== signature) {
        console.warn("Mercado Pago webhook: invalid signature", { expected, signature });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Loguear el evento para depuración; aquí podés procesarlo y actualizar DB
    console.log("Mercado Pago webhook received:", JSON.stringify(body, null, 2));

    // Responder 200
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error processing Mercado Pago webhook:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
