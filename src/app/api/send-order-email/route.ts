import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { saveOrder, OrderItem } from "@/lib/orders";

interface EmailBody {
  name?: string;
  email: string;
  phone: string;
  items: OrderItem[];
  deliveryOption: string;
  deliveryAddress: string;
  totalPrice: number;
  totalMixQty: number;
  paymentLink?: string;
  paymentMethod?: string;
  discountCode?: string | null;
  discountAmount?: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Iniciando envío de email...");
    const body = await request.json() as EmailBody;
    const { name, email, phone, items, deliveryOption, deliveryAddress, totalPrice, totalMixQty, paymentLink, paymentMethod, discountCode, discountAmount } = body;

    console.log("Datos recibidos:", {
      email,
      name,
      phone,
      itemsCount: items.length,
      deliveryOption,
      paymentMethod,
      totalPrice,
      discountCode,
      discountAmount
    });

    // Validar datos requeridos
    if (!email || !phone || !items || items.length === 0) {
      console.error("Datos faltantes:", { email: !!email, phone: !!phone, items: items?.length });
      return NextResponse.json(
        { error: "Hubo un error: Por favor intente nuevamente más tarde" },
        { status: 400 }
      );
    }

    // Verificar que la API key de Resend esté configurada
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY no está configurada");
      return NextResponse.json(
        { error: "Hubo un error: Por favor intente nuevamente más tarde" },
        { status: 500 }
      );
    }

    // Inicializar Resend solo cuando se necesita
    console.log("Inicializando Resend...");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const currency = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    });

    // Función para detectar ingredientes que difieren entre mixes
    const getIngredientDifferences = (items: OrderItem[]) => {
      const differences = new Map<number, Set<string>>();

      items.forEach((item, index) => {
        const match = (item.title ?? '').match(/^(.*?)\s*\((.*)\)$/);
        if (!match) return;

        const composition = match[2];
        const currentIngredients = new Map<string, number>();

        // Parsear ingredientes del mix actual
        composition.split(',').forEach(ing => {
          const ingMatch = ing.trim().match(/^(.+?)\s+(\d+)%$/);
          if (ingMatch) {
            currentIngredients.set(ingMatch[1].trim(), parseInt(ingMatch[2]));
          }
        });

        const itemDifferences = new Set<string>();

        // Comparar con otros Mixes
        items.forEach((otherItem, otherIndex) => {
          if (otherIndex !== index) {
            const otherMatch = (otherItem.title ?? '').match(/^(.*?)\s*\((.*)\)$/);
            if (!otherMatch) return;

            const otherComposition = otherMatch[2];
            const otherIngredients = new Map<string, number>();

            // Parsear ingredientes del otro mix
            otherComposition.split(',').forEach(ing => {
              const ingMatch = ing.trim().match(/^(.+?)\s+(\d+)%$/);
              if (ingMatch) {
                otherIngredients.set(ingMatch[1].trim(), parseInt(ingMatch[2]));
              }
            });

            // Comparar ingredientes
            currentIngredients.forEach((percent, ingredient) => {
              const otherPercent = otherIngredients.get(ingredient);
              if (otherPercent !== undefined && percent !== otherPercent) {
                itemDifferences.add(ingredient);
              }
            });
          }
        });

        differences.set(index, itemDifferences);
      });

      return differences;
    };

    const ingredientDifferences = getIngredientDifferences(items);

    // Generar HTML del resumen
    const itemsHTML = items.map((item, index) => {
      // Extraer composición del título (ej: "Mix personalizado (Pera 20%, ...)")
      const match = (item.title ?? '').match(/^(.*?)\s*\((.*)\)$/);
      const productName = match ? match[1] : (item.title ?? '');
      let composition = match ? match[2] : '';

      // Destacar ingredientes que difieren
      if (composition && ingredientDifferences.has(index)) {
        const differentIngredients = ingredientDifferences.get(index)!;
        composition = composition.split(',').map(ing => {
          const ingMatch = ing.trim().match(/^(.+?)\s+(\d+)%$/);
          if (ingMatch) {
            const ingredient = ingMatch[1].trim();
            const percent = ingMatch[2];
            if (differentIngredients.has(ingredient)) {
              return `<strong style="color: #fbbf24;">${ingredient} ${percent}%</strong>`;
            }
          }
          return ing.trim();
        }).join(', ');
      }

      // Para Mixes personalizados, mostrar precio original sin promos
      const qty = Number(item.quantity ?? 0);
      const unit = Number(item.unit_price ?? 0);
      let displayPrice = unit * qty;
      if (productName && productName.includes('Mix personalizado')) {
        displayPrice = 4000 * qty; // Precio original sin promos
      }

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <strong>${productName}</strong>
            ${composition ? `<br><span style="font-size: 13px; color: #666; line-height: 1.6;">${composition}</span>` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currency.format(displayPrice)}</td>
        </tr>
      `;
    }).join('');

    // Calcular ahorros para mostrar en la tabla
    const precioUnitario = 4000;
    const precioSinPromo = totalMixQty * precioUnitario;
    const costoEnvio = deliveryOption === "envio" ? 1000 : 0;

    // Calcular precio con promos aplicadas (packs de 15, packs de 5, y unidades sueltas)
    const n15 = Math.floor(totalMixQty / 15);
    const remAfter15 = totalMixQty - n15 * 15;
    const n5 = Math.floor(remAfter15 / 5);
    const n1 = remAfter15 - n5 * 5;

    const precioConPromo = n15 * 53000 + n5 * 18000 + n1 * precioUnitario;
    const descuentoPromo = precioSinPromo - precioConPromo;

    // Generar filas de ahorros
    let ahorrosHTML = '';

    // Ahorro por envío gratuito
    if (costoEnvio > 0) {
      ahorrosHTML += `
        <tr style="background-color: #f0fdf4;">
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #16a34a;">
            <strong>🚚 Ahorro por envío gratuito</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #16a34a;">1</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #16a34a; white-space:nowrap;">- ${currency.format(costoEnvio)}</td>
        </tr>
      `;
    }

    // Ahorro por descuento por código
    if (discountCode && discountAmount && discountAmount > 0) {
      // Aplicar tope por seguridad (en caso de que venga mayor desde el cliente)
      const DISCOUNT_CAP = 787;
      const displayDiscountAmount = Math.min(discountAmount, DISCOUNT_CAP);

      // Detectar si el descuento es porcentual (para mostrar "(- 7%)") o fijo
      let discountIsPercentage = false;
      let discountPercent = 0;
      try {
        const mapEnv = process.env.NEXT_PUBLIC_DISCOUNT_MAP || '';
        if (mapEnv) {
          const parsed = JSON.parse(mapEnv) as Record<string, { type: 'percentage' | 'fixed'; value: number }>;
          const mapped = parsed[(discountCode || '').toUpperCase()];
          if (mapped) {
            if (mapped.type === 'percentage') {
              discountIsPercentage = true;
              discountPercent = mapped.value;
            }
          }
        }
      } catch {
        // ignore parse errors
      }

      // Fallback heurística si no viene en el mapa
      if (!discountIsPercentage) {
        const numberMatch = (discountCode || '').toUpperCase().match(/(\d+)$/);
        if (numberMatch) {
          const num = parseInt(numberMatch[1]);
          if (numberMatch[1].length <= 2 && num > 0 && num <= 100) {
            discountIsPercentage = true;
            discountPercent = num;
          }
        }
      }

      const leftLabel = discountIsPercentage
        ? `🎉 Ahorro por el código de descuento ${discountCode} (- ${discountPercent}%)`
        : `🎉 Ahorro por el código de descuento ${discountCode}`;

      ahorrosHTML += `
        <tr style="background-color: #f0fdf4;">
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #16a34a;">
            <strong>${leftLabel}</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #16a34a;">1</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #16a34a; white-space:nowrap;">- ${currency.format(displayDiscountAmount)}</td>
        </tr>
      `;
    }

    // Ahorro por promos (desglose por packs de 15 y de 5)
    if (descuentoPromo > 0) {
      const promoParts: string[] = [];
      if (n15 > 0) promoParts.push(`${n15} de 15 Mixes`);
      if (n5 > 0) promoParts.push(`${n5} de 5 Mixes`);
      const promoLabel = promoParts.length > 0 ? ` (${promoParts.join(' + ')})` : '';

      ahorrosHTML += `
        <tr style="background-color: #f0fdf4;">
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #16a34a;">
            <strong>🎉 Ahorro por promos${promoLabel}</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #16a34a;">1</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #16a34a; white-space:nowrap;">- ${currency.format(descuentoPromo)}</td>
        </tr>
      `;
    }

    const deliveryText = deliveryOption === "ciudad"
      ? "Ciudad Universitaria (Envío gratuito)"
      : `Córdoba (${currency.format(1000)})`;

    console.log("Enviando email...");

    let result;
    try {
      const emailSubject = paymentMethod === 'efectivo'
        ? `📱 ¡${name ? name + ', ' : ''}tu pedido está confirmado! Te contactaremos por WhatsApp`
        : `🎉 ¡${name ? name + ', ' : ''}tu pedido de Frutos Secos está casi listo!`;

      // Persist order to orders datastore (Supabase) and generate pay token
      let savedOrderId: string | null = null;
      try {
        const id = await saveOrder({
          name,
          email,
          phone,
          items,
          deliveryOption,
          deliveryAddress,
          totalPrice,
          totalMixQty,
          paymentMethod,
          paymentLink,
          discountCode,
          discountAmount,
        });
        savedOrderId = id;
      } catch (err) {
        console.error('Error persisting order:', err);
      }

      // If no direct paymentLink provided, create a pay token so the email can include /pay/{token}
      let paymentToken: string | undefined = undefined;
      if (!paymentLink && savedOrderId) {
        try {
          const { createPayToken } = await import('@/lib/payToken');
          paymentToken = createPayToken(savedOrderId);
        } catch (err) {
          console.error('Error creating payment token:', err);
        }
      }

      // Build action block (WhatsApp + optional Mercado Pago button) with matching heights and spacing
      // Use an emoji for the WhatsApp button to avoid image-blocking in email clients
      const whatsappButton = `
        <a href="https://wa.me/5493513239624" style="display:inline-block; height:48px; line-height:48px; background-color:#25d366; color:white; padding:0 14px; text-decoration:none; border-radius:8px; font-weight:700; vertical-align:middle;">
          <span style="display:inline-block; vertical-align:middle; font-size:18px; margin-right:8px;">📱</span>
          <span style="display:inline-block; vertical-align:middle; line-height:1;">Coordinar ahora por WhatsApp</span>
        </a>
      `;

      // If we have a direct paymentLink prefer it; otherwise use pay token link that will create/redirect on-demand
      const payHref = paymentLink ? paymentLink : (paymentToken && process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')}/pay/${paymentToken}` : '');
      const payButton = payHref ? (`
        <a href="${payHref}" style="display:inline-block; height:48px; line-height:48px; background-color:#fbbf24; color:#000; padding:0 14px; text-decoration:none; border-radius:8px; font-weight:700; vertical-align:middle;">
          <span style="display:inline-block; vertical-align:middle; line-height:1;">💳 Pagar ahora con Mercado Pago</span>
        </a>
      `) : '';

      // Use a simple spacer element between buttons (more compatible than flex gap in some email clients)
      const spacer = payButton ? '<span style="display:inline-block; width:10px; height:1px;"></span>' : '';
      const buttonsRow = `<div style="text-align:center; margin-top:16px;">${whatsappButton}${spacer}${payButton}</div>`;

      // Small hint shown below buttons when a Mercado Pago button is available
      const mpNote = payButton ? `<p style="margin-top:8px; font-size:14px; color:#333;">Si preferís pagar ahora, usá el botón de Mercado Pago (pago seguro y rápido).</p>` : '';

      const efectivoBlock = `
        <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>📱 ¡Te contactaremos por WhatsApp!</strong></p>
          <p style="margin: 0;">Tu pedido está confirmado. Te vamos a contactar para coordinar la entrega y el pago en efectivo. Si querés tomar la iniciativa, podés escribirnos directamente:</p>
          <div style="text-align: center;">${buttonsRow}${mpNote}</div>
        </div>
      `;

      const nonEfectivoBlock = `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>⚠️ Último paso: completá el pago</strong></p>
          <p style="margin: 0;">Tu pedido está reservado. <strong>Si todavía no lo abonaste</strong> hacé click en el botón de abajo:</p>
          <div style="text-align: center;">${buttonsRow}${mpNote}</div>
        </div>
      `;

      const actionBlock = (paymentMethod === 'efectivo') ? efectivoBlock : nonEfectivoBlock;

      result = await resend.emails.send({
        from: "Gonza de Moovimiento <gonza@moovimiento.com>",
        to: email,
        bcc: ["gonza@moovimiento.com", "gonzalogramagia@gmail.com"],
        subject: emailSubject,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fbbf24; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; color: white; font-size: 20px;">⚡ Moovimiento</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <h1 style="font-size: 28px; color: #fbbf24;">🤩 ¡Pedido casi listo!</h1>
            <p style="font-size: 18px;">¡Hola${name ? ` ${name}` : ''}! 👋</p>
            <p>Gracias por armar tu mix personalizado con nosotros. Acá te dejamos el resumen de tu pedido:</p>

            <h3>Detalle del pedido:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border-radius: 4px;">
              <thead>
                <tr>
                  <th style="background-color: #f3f4f6; padding: 12px; text-align: left;">Producto</th>
                  <th style="background-color: #f3f4f6; padding: 12px; text-align: center;">Cantidad</th>
                  <th style="background-color: #f3f4f6; padding: 12px; text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
                ${deliveryOption === "envio" ? `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>Envío a Córdoba</strong>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">1</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; white-space:nowrap;">${currency.format(1000)}</td>
                </tr>
                ` : ''}
                ${ahorrosHTML}
              </tbody>
            </table>

            <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0;"><strong>Total de Mixes:</strong> ${totalMixQty} 📦</p>
              <p style="margin: 0;"><strong>Gramos:</strong> ${totalMixQty * 220}g ⚡</p>
            </div>
            
            <h3>Información de entrega:</h3>
            <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0;"><strong>Delivery en:</strong> ${deliveryText}</p>
              <p style="margin: 0 0 8px 0;"><strong>Dirección:</strong> ${deliveryAddress || "No especificada"}</p>
              <p style="margin: 0;"><strong>Celular:</strong> ${phone}</p>
            </div>

            

            

            <table style="width:100%; background-color: #f3f4f6; padding: 12px; margin: 20px 0; border-radius: 4px; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; vertical-align: middle;">
                  <strong style="font-size: 20px;">${paymentMethod === 'efectivo' ? 'Total a pagar en efectivo:' : 'Total a pagar:'}</strong>
                </td>
                <td style="padding: 12px; text-align: right; vertical-align: middle; white-space:nowrap; font-size: 20px; font-weight: bold;">${currency.format(totalPrice)}</td>
              </tr>
            </table>

            ${actionBlock}
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Una vez que confirmes el pago, te vamos a enviar otro email con todos los detalles de la entrega 📦
            </p>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              ¿Tenés alguna duda? Escribime a <a href="mailto:gonza@moovimiento.com">gonza@moovimiento.com</a> o visitá nuestras <a href="https://www.moovimiento.com/#faq">Preguntas Frecuentes</a>
            </p>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              ¡Gracias por confiar en nosotros! ⚡<br>
              Gonza
            </p>
          </div>
        </div>
      `,
      });
    } catch (resendError) {
      console.error("Error específico de Resend:", resendError);
      throw resendError;
    }

    console.log("Email enviado exitosamente:", result);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);

    return NextResponse.json(
      { error: "Hubo un error: Por favor intente nuevamente más tarde" },
      { status: 500 }
    );
  }
}
