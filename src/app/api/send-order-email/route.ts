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
      totalPrice 
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
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #fbbf24; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
              .info-box { background-color: #fff; border: 1px solid #e5e7eb; padding: 16px; margin: 20px 0; border-radius: 4px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border-radius: 4px; overflow: hidden; }
              th { background-color: #f3f4f6; padding: 12px; text-align: left; }
              .payment-btn { display: inline-block; background-color: #fbbf24; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0; }
              .payment-btn:hover { background-color: #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0; color: white; font-size: 20px; text-align: left;">⚡ Moovimiento</h2>
              </div>
              <div class="content">
                <h1 style="font-size: 28px; color: #fbbf24;">🤩 ¡Pedido casi listo!</h1>
                <p style="font-size: 18px;">¡Hola${name ? ` ${name}` : ''}! 👋</p>
                <p>Gracias por armar tu mix personalizado con nosotros. Acá te dejamos el resumen de tu pedido:</p>

                <h3>Detalle del pedido:</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style="text-align: center;">Cantidad</th>
                      <th style="text-align: right;">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>

                <div class="info-box">
                  <p style="margin: 0 0 8px 0;"><strong>Total de mixs:</strong> ${totalMixQty} 📦</p>
                  <p style="margin: 0;"><strong>Gramos:</strong> ${totalMixQty * 220}g ⚡</p>
                </div>
                
                <h3>Información de entrega:</h3>
                <div class="info-box">
                  <p style="margin: 0 0 8px 0;"><strong>Delivery en:</strong> ${deliveryText}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Dirección:</strong> ${deliveryAddress || "No especificada"}</p>
                  <p style="margin: 0;"><strong>Celular:</strong> ${phone}</p>
                </div>

                ${discountCode && discountAmount && discountAmount > 0 ? `
                <h3>Descuento aplicado:</h3>
                <div class="info-box" style="background-color: #f0fdf4; border-color: #22c55e;">
                  <p style="margin: 0; color: #16a34a;"><strong>🎉 Código ${discountCode}</strong></p>
                  <p style="margin: 0; color: #16a34a;">Descuento: ${currency.format(discountAmount)}</p>
                </div>
                ` : ''}

                <div style="background-color: #f3f4f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 20px; font-weight: bold;">Total a pagar: ${currency.format(totalPrice)}</p>
                </div>

                ${paymentMethod === 'efectivo' ? `
                <div class="warning-box" style="background-color: #dbeafe; border-left-color: #3b82f6;">
                  <p style="margin: 0 0 8px 0; font-size: 16px;">
                    <strong>📱 ¡Pedido confirmado! Te contactaremos por WhatsApp</strong>
                  </p>
                  <p style="margin: 0;">Tu pedido está confirmado. Te vamos a contactar por WhatsApp para coordinar la entrega y el pago en efectivo.</p>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  Te contactaremos pronto por WhatsApp para coordinar la entrega y el pago en efectivo 📦💵
                </p>
                ` : `
                <div class="warning-box">
                  <p style="margin: 0 0 8px 0; font-size: 16px;">
                    <strong>⚠️ Último paso: completá el pago</strong>
                  </p>
                  <p style="margin: 0;">Tu pedido está reservado. Para confirmarlo, hacé click en el botón de abajo <strong>si todavía no lo hiciste</strong>:</p>
                  ${paymentLink ? `
                    <div style="text-align: center; margin-top: 16px;">
                      <a href="${paymentLink}" class="payment-btn">
                        💳 Pagar con Mercado Pago
                      </a>
                    </div>
                  ` : ''}
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  Una vez que confirmes el pago, te vamos a enviar otro email con todos los detalles de la entrega 📦
                </p>
                `}

                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                  ¿Tenés alguna duda? Escribime a <a href="mailto:gonza@moovimiento.com">gonza@moovimiento.com</a>, <a href="https://wa.me/5493513239624">por WhatsApp</a> o visitá nuestras <a href="https://www.moovimiento.com/#faq">Preguntas Frecuentes</a>
                </p>

                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                  ¡Gracias por confiar en nosotros! ⚡<br>
                  Gonza
                </p>
              </div>
            </div>
          </body>
        </html>
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
