import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { saveOrder, OrderItem } from "@/lib/orders";

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

interface CheckoutItem {
  title: string;
  quantity: number;
  unit_price: number;
  // Opcional: categoría y descripción para mejorar la tasa de aprobación de Mercado Pago
  category_id?: string;
  description?: string;
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
    category_id?: string;
    description?: string;
  }>;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  // URL to receive Mercado Pago webhooks
  notification_url?: string;
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
      // Enviar category_id y description si están disponibles para mejorar la aprobación
      category_id: item.category_id,
      description: item.description,
    }));

  // Agregar descuento como item negativo si existe
  let _cappedDiscountAmount: number | undefined;
  if (discountCode && discountAmount && discountAmount > 0) {
      // Aplicar tope al descuento para evitar descuentos mayores al permitido
      const DISCOUNT_CAP = 787;
      const effectiveDiscount = Math.min(discountAmount, DISCOUNT_CAP);
      preferenceItems.push({
        id: `discount-${discountCode}`,
        title: `Descuento (${discountCode})`,
        quantity: 1,
        unit_price: -effectiveDiscount, // Precio negativo para descuento
        currency_id: "ARS",
        category_id: undefined,
        description: `Descuento aplicado: ${discountCode}`,
      });
      // Use effectiveDiscount later when persisting the order
      // (we'll pass it explicitly to saveOrder)
      // store in outer scoped variable for later
      _cappedDiscountAmount = effectiveDiscount;
    }

    const preferenceData: PreferenceData = {
      items: preferenceItems,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pending`,
      },
      // URL donde Mercado Pago enviará las notificaciones (webhooks)
      // Asegúrate de configurar NEXT_PUBLIC_BASE_URL en el entorno.
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
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

    // Persistir el pedido en Supabase para que los pedidos web queden registrados
    try {
      // Calcular totales
      const totalMixQty = (items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
      const totalPrice = (preferenceData.items || []).reduce((sum, it) => {
        const item = it as { unit_price?: number; quantity?: number };
        const up = Number(item.unit_price ?? 0) || 0;
        const q = Number(item.quantity ?? 0) || 0;
        return sum + up * q;
      }, 0);

      await saveOrder({
        name,
        email,
        phone: phone ?? '',
        items: items as unknown as OrderItem[],
        deliveryOption,
        deliveryAddress,
        totalPrice,
        totalMixQty,
        paymentMethod: 'mercadopago',
        paymentLink: response.init_point,
        discountCode,
        discountAmount: typeof _cappedDiscountAmount !== 'undefined' ? _cappedDiscountAmount : discountAmount,
      });
    } catch (err) {
      console.error('Error saving order after creating preference:', err);
      // No interrumpimos la respuesta al cliente; la preferencia ya fue creada.
    }

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
