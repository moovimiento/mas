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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EmailBody;
    const { name, email, phone, items, deliveryOption, deliveryAddress, totalPrice, totalMixQty, paymentLink } = body;

    // Inicializar Resend solo cuando se necesita
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

    await resend.emails.send({
      from: "Gonza de Moovimiento <gonza@moovimiento.com>",
      to: email,
      bcc: ["gonza@moovimiento.com", "gonzalogramagia@gmail.com"],
      subject: "🎉 ¡Tu pedido de Frutos Secos está casi listo!",
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
                <h2 style="margin: 0; color: white; font-size: 24px;">⚡ Pedido casi listo</h2>
              </div>
              <div class="content">
                <h1 style="font-size: 28px;">¡Hola${name ? ` ${name}` : ''}! 👋</h1>
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
                  <p style="margin: 0 0 8px 0;"><strong>Opción:</strong> ${deliveryText}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Dirección:</strong> ${deliveryAddress || "No especificada"}</p>
                  <p style="margin: 0;"><strong>Celular:</strong> ${phone}</p>
                </div>

                <div style="background-color: #f3f4f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 20px; font-weight: bold;">Total a pagar: ${currency.format(totalPrice)}</p>
                </div>

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
                  Una vez que confirmes el pago, te vamos a enviar otro email con todos los detalles de la entrega. 📦
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
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 }
    );
  }
}
