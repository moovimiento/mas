import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, deliveryOption, deliveryAddress } = body;

    console.log("Creating preference with items:", items);

    // Crear preferencia de pago
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: items.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: "ARS",
        })),
        back_urls: {
          success: "http://localhost:3000/checkout/success",
          failure: "http://localhost:3000/checkout/failure",
          pending: "http://localhost:3000/checkout/pending",
        },
        auto_return: "approved",
        external_reference: JSON.stringify({
          deliveryOption,
          deliveryAddress,
          timestamp: Date.now(),
        }),
      },
    });

    console.log("Preference created:", response.id);

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("Error creating preference:", error);
    console.error("Error details:", error.message, error.cause);
    return NextResponse.json(
      { error: error.message || "Error al crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
