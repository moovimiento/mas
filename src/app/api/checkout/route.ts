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
  discountCode?: string | null;
  discountAmount?: number;
}

interface PreferenceData {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  statement_descriptor: string;
  external_reference: string;
  locale?: string;
  payer?: {
    email: string;
    name?: string;
    phone?: {
      area_code: string;
      number: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CheckoutBody;
    const { items, deliveryOption, deliveryAddress, email, name, phone, discountCode, discountAmount } = body;

    console.log("Creating preference with items:", items);
    console.log("Discount info:", { discountCode, discountAmount });

    // Crear preferencia de pago
    const preference = new Preference(client);

    // Mapear items existentes
    const preferenceItems = items.map((item, index) => ({
      id: `item-${index}`,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "ARS",
    }));

    // Agregar descuento como item negativo si existe
    if (discountCode && discountAmount && discountAmount > 0) {
      preferenceItems.push({
        id: `discount-${discountCode}`,
        title: `Descuento (${discountCode})`,
        quantity: 1,
        unit_price: -discountAmount, // Precio negativo para descuento
        currency_id: "ARS",
      });
    }

    const preferenceData: PreferenceData = {
      items: preferenceItems,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pending`,
      },
      auto_return: "approved",
      statement_descriptor: "MOOVIMIENTO",
      locale: "es-AR",
      external_reference: JSON.stringify({
        deliveryOption,
        deliveryAddress,
        name,
        email,
        phone,
        discountCode,
        discountAmount,
        timestamp: Date.now(),
      }),
      payer: {
        email: email,
      },
    };

    console.log("Preference data:", JSON.stringify(preferenceData, null, 2));

    const response = await preference.create({
      body: preferenceData,
    });

    console.log("Preference created:", response.id);
    console.log("Init point:", response.init_point);

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
