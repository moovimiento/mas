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
  email: string;
  name?: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CheckoutBody;
    const { items, deliveryOption, deliveryAddress, email, name, phone } = body;

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
        payer: {
          name: name || undefined,
          email: email,
          phone: phone ? {
            area_code: "",
            number: phone,
          } : undefined,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pending`,
        },
        auto_return: "approved",
        external_reference: JSON.stringify({
          deliveryOption,
          deliveryAddress,
          name,
          email,
          phone,
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
    console.error("Error creating preference:", error);
    if (error && typeof error === 'object' && 'message' in error) {
      console.error("Error message:", error.message);
    }
    if (error && typeof error === 'object' && 'cause' in error) {
      console.error("Error cause:", error.cause);
    }
    const errorMessage = error instanceof Error ? error.message : "Error al crear la preferencia de pago";
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}
