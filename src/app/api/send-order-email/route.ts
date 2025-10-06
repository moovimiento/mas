import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface OrderItem {
  title: string;
  quantity: number;
  unit_price: number;
}

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

    // Generar HTML del resumen
    const itemsHTML = items.map(item => {
      // Extraer composición del título (ej: "Mix personalizado (Pera 20%, ...)")
      const match = item.title.match(/^(.*?)\s*\((.*)\)$/);
      const productName = match ? match[1] : item.title;
      const composition = match ? match[2] : '';
      
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <strong>${productName}</strong>
            ${composition ? `<br><span style="font-size: 13px; color: #666; line-height: 1.6;">${composition}</span>` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currency.format(item.unit_price * item.quantity)}</td>
        </tr>
      `;
    }).join('');

    const deliveryText = deliveryOption === "ciudad" 
      ? "Ciudad Universitaria (Envío gratuito)" 
      : `Córdoba (${currency.format(1000)})`;

    console.log("Enviando email...");
    
    let result;
    try {
      result = await resend.emails.send({
      from: "Gonza de Moovimiento <gonza@moovimiento.com>",
      to: email,
      bcc: ["gonza@moovimiento.com", "gonzalogramagia@gmail.com"],
      subject: paymentMethod === 'efectivo' ? "📱 ¡Tu pedido está confirmado! Te contactaremos por WhatsApp" : "🎉 ¡Tu pedido de Frutos Secos está casi listo!",
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
              </tbody>
            </table>

            <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0;"><strong>Total de mixs:</strong> ${totalMixQty} 📦</p>
              <p style="margin: 0;"><strong>Gramos:</strong> ${totalMixQty * 220}g ⚡</p>
            </div>
            
            <h3>Información de entrega:</h3>
            <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0;"><strong>Delivery en:</strong> ${deliveryText}</p>
              <p style="margin: 0 0 8px 0;"><strong>Dirección:</strong> ${deliveryAddress || "No especificada"}</p>
              <p style="margin: 0;"><strong>Celular:</strong> ${phone}</p>
            </div>

            ${discountCode && discountAmount && discountAmount > 0 ? `
            <h3>Descuento aplicado:</h3>
            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #16a34a;"><strong>🎉 Código ${discountCode}</strong></p>
              <p style="margin: 0; color: #16a34a;">Descuento: ${currency.format(discountAmount)}</p>
            </div>
            ` : ''}

            ${(() => {
              // Calcular descuento por promos
              const precioUnitario = 4000;
              const precioSinPromo = totalMixQty * precioUnitario;
              const descuentoPromo = precioSinPromo - totalPrice;
              
              if (descuentoPromo > 0) {
                return `
                <h3>Ahorro por promos:</h3>
                <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #16a34a;"><strong>🎉 Promo por cantidad (${totalMixQty} mixs)</strong></p>
                  <p style="margin: 0; color: #16a34a;">Ahorro: ${currency.format(descuentoPromo)}</p>
                </div>
                `;
              }
              return '';
            })()}

            <div style="background-color: #f3f4f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 20px; font-weight: bold;">Total a pagar en efectivo: ${currency.format(totalPrice)}</p>
            </div>

            ${paymentMethod === 'efectivo' ? `
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 16px;">
                <strong>📱 ¡Te contactaremos por WhatsApp!</strong>
              </p>
              <p style="margin: 0;">Tu pedido está confirmado. Te vamos a contactar para coordinar la entrega y el pago en efectivo. Si querés tomar la iniciativa, podés escribirnos directamente:</p>
              <div style="text-align: center; margin-top: 16px;">
                <a href="https://wa.me/5493513239624" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Coordinar ahora por WhatsApp
                </a>
              </div>
            </div>
            ` : `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 16px;">
                <strong>⚠️ Último paso: completá el pago</strong>
              </p>
              <p style="margin: 0;">Tu pedido está reservado. <strong>Si todavía no lo abonaste</strong> hacé click en el botón de abajo:</p>
              ${paymentLink ? `
                <div style="text-align: center; margin-top: 16px;">
                  <a href="${paymentLink}" style="display: inline-block; background-color: #fbbf24; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    💳 Abonar ahora con Mercado Pago
                  </a>
                </div>
              ` : ''}
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Una vez que confirmes el pago, te vamos a enviar otro email con todos los detalles de la entrega 📦
            </p>
            `}

            ${paymentMethod === 'efectivo' ? `
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              ¿Tenés alguna duda? Escribinos a <a href="mailto:gonza@moovimiento.com">gonza@moovimiento.com</a> o visitá nuestras <a href="https://www.moovimiento.com/#faq">Preguntas Frecuentes</a>
            </p>
            ` : `
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              ¿Tenés alguna duda? Escribinos a <a href="mailto:gonza@moovimiento.com">gonza@moovimiento.com</a> o visitá nuestras <a href="https://www.moovimiento.com/#faq">Preguntas Frecuentes</a>
            </p>
            `}

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
