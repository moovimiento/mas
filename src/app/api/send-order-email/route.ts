import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface OrderItem {
  title: string;
  quantity: number;
  unit_price: number;
}

interface EmailBody {
  email: string;
  items: OrderItem[];
  deliveryOption: string;
  deliveryAddress: string;
  totalPrice: number;
  totalMixQty: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EmailBody;
    const { email, items, deliveryOption, deliveryAddress, totalPrice, totalMixQty } = body;

    // Inicializar Resend solo cuando se necesita
    const resend = new Resend(process.env.RESEND_API_KEY);

    const currency = new Intl.NumberFormat("es-AR", { 
      style: "currency", 
      currency: "ARS", 
      maximumFractionDigits: 0 
    });

    // Generar HTML del resumen
    const itemsHTML = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currency.format(item.unit_price * item.quantity)}</td>
      </tr>
    `).join('');

    const deliveryText = deliveryOption === "ciudad" 
      ? "Ciudad Universitaria (Envío gratuito)" 
      : `Córdoba (${currency.format(1000)})`;

    await resend.emails.send({
      from: "Gonza de Moovimiento <gonza@moovimiento.com>",
      to: email,
      subject: "¡Tu pedido de Frutos Secos está casi listo! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #fbbf24; padding: 20px; text-center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background-color: #f3f4f6; padding: 12px; text-align: left; }
              .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; color: #000;">⚡ Moovimiento</h1>
                <p style="margin: 5px 0 0 0; color: #000;">Mixs de Frutos Secos</p>
              </div>
              <div class="content">
                <h2>¡Hola! 👋</h2>
                <p>Gracias por armar tu mix personalizado con nosotros. Acá te dejamos el resumen de tu pedido:</p>
                
                <div class="warning">
                  <strong>⚠️ Último paso: completá el pago</strong><br>
                  Tu pedido está reservado. Para confirmarlo, solo falta que completes el pago en Mercado Pago.
                </div>

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

                <p><strong>Total de mixs:</strong> ${totalMixQty}</p>
                <p><strong>Energía acumulada:</strong> ${totalMixQty} ⚡</p>
                
                <h3>Información de entrega:</h3>
                <p><strong>Opción:</strong> ${deliveryText}</p>
                <p><strong>Dirección:</strong> ${deliveryAddress || "No especificada"}</p>

                <div class="total">
                  <p>Total a pagar: ${currency.format(totalPrice)}</p>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  Una vez que confirmes el pago, te vamos a enviar otro email con todos los detalles de la entrega. 📦
                </p>

                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                  ¿Tenés alguna duda? Escribime a <a href="mailto:gonza@moovimiento.com">gonza@moovimiento.com</a> o visitá nuestras <a href="https://www.moovimiento.com/#faq">Preguntas Frecuentes</a>
                </p>

                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                  ¡Gracias por confiar en Moovimiento! ⚡<br>
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
