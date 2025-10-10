import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface ConfirmationBody {
  name?: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  deliveryOption: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ConfirmationBody;
    const { name, email, phone, deliveryAddress, deliveryOption } = body;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const deliveryText = deliveryOption === "ciudad" 
      ? "Ciudad Universitaria (Envío gratuito)" 
      : "Córdoba";

    const whatsappLink = `https://wa.me/5493513239624?text=${encodeURIComponent(`Hola! Soy ${name || 'un cliente'}, acabo de confirmar mi pago y quiero coordinar la entrega.`)}`;

    const emailSubject = `✅ ¡Pago confirmado ${name}! Ya nos ponemos en contacto`;

    await resend.emails.send({
      from: "Gonza de Moovimiento <gonza@moovimiento.com>",
      to: email,
      bcc: ["gonza@moovimiento.com", "gonzalogramagia@gmail.com"],
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
              .whatsapp-btn { display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0; }
              .whatsapp-btn:hover { background-color: #059669; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0; color: white; font-size: 20px; text-align: left;">⚡ Moovimiento</h2>
              </div>
              <div class="content">
                <h1 style="font-size: 28px; color: #10b981;">✅ ¡Pago confirmado!</h1>
                <p style="font-size: 18px;">¡Hola${name ? ` ${name}` : ''}! 🤝</p>
                
                <div class="success-box">
                  <p style="margin: 0; font-size: 16px;">
                    <strong>Tu pago fue procesado exitosamente.</strong><br>
                    Ya estamos preparando tu pedido de Frutos Secos personalizados.
                  </p>
                </div>

                <h3>Próximos pasos:</h3>
                <p>
                  Nos vamos a poner en contacto por el celular <strong>${phone}</strong> que proporcionaste para coordinar la entrega.
                </p>

                <h3>Información de entrega:</h3>
                <p><strong>Delivery en:</strong> ${deliveryText}</p>
                <p><strong>Dirección:</strong> ${deliveryAddress}</p>
                <p><strong>Celular de contacto:</strong> ${phone}</p>

                <div style="text-align: center; margin: 30px 0;">
                  <p style="margin-bottom: 12px; font-size: 16px;">
                    <strong>¿Querés tomar la iniciativa?</strong><br>
                    Hablame directamente por WhatsApp:
                  </p>
                  <a href="${whatsappLink}" class="whatsapp-btn">
                    💬 Chatear por WhatsApp
                  </a>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #666;">
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
    console.error("Error sending confirmation email:", error);
    return NextResponse.json(
      { error: "Error al enviar el email de confirmación" },
      { status: 500 }
    );
  }
}
