import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

interface CheckoutItem {
  title: string;
  quantity: number;
  unit_price: number;
}

interface CheckoutBody {
  items: CheckoutItem[];
  deliveryOption: string;
  deliveryAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CheckoutBody;
    const { items, deliveryOption, deliveryAddress } = body;

    console.log("Creating preference with items:", items);

    // Crear preferencia de pago
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: items.map((item, index) => ({
          id: `item-${index}`,
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error al crear la preferencia de pago";
    console.error("Error creating preference:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
