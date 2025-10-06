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

    // Función para detectar ingredientes que difieren entre mixes
    const getIngredientDifferences = (items: OrderItem[]) => {
      const differences = new Map<number, Set<string>>();
      
      items.forEach((item, index) => {
        const match = item.title.match(/^(.*?)\s*\((.*)\)$/);
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
        
        // Comparar con otros mixes
        items.forEach((otherItem, otherIndex) => {
          if (otherIndex !== index) {
            const otherMatch = otherItem.title.match(/^(.*?)\s*\((.*)\)$/);
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
      const match = item.title.match(/^(.*?)\s*\((.*)\)$/);
      const productName = match ? match[1] : item.title;
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
      
      // Para mixs personalizados, mostrar precio original sin promos
      let displayPrice = item.unit_price * item.quantity;
      if (productName.includes('Mix personalizado')) {
        displayPrice = 4000 * item.quantity; // Precio original sin promos
      }
      
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <strong>${productName}</strong>
            ${composition ? `<br><span style="font-size: 13px; color: #666; line-height: 1.6;">${composition}</span>` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currency.format(displayPrice)}</td>
        </tr>
      `;
    }).join('');

    // Calcular ahorros para mostrar en la tabla
    const precioUnitario = 4000;
    const precioSinPromo = totalMixQty * precioUnitario;
    const costoEnvio = deliveryOption === "ciudad" ? 1000 : 0;
    
    // Calcular precio con promos aplicadas
    let precioConPromo = precioSinPromo;
    if (totalMixQty >= 15) {
      precioConPromo = 53000; // 15 mixs por $53.000 (ahorro de $7.000)
    } else if (totalMixQty >= 5) {
      precioConPromo = 18000; // 5 mixs por $18.000 (ahorro de $2.000)
    }
    
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
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #16a34a;">- ${currency.format(costoEnvio)}</td>
        </tr>
      `;
    }
    
    // Ahorro por descuento por código
    if (discountCode && discountAmount && discountAmount > 0) {
      ahorrosHTML += `
        <tr style="background-color: #f0fdf4;">
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #16a34a;">
            <strong>🎉 Ahorro por código de descuento</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #16a34a;">1</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #16a34a;">- ${currency.format(discountAmount)}</td>
        </tr>
      `;
    }
    
    // Ahorro por promos
    if (descuentoPromo > 0) {
      ahorrosHTML += `
        <tr style="background-color: #f0fdf4;">
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #16a34a;">
            <strong>🎉 Ahorro por promos</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #16a34a;">1</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #16a34a;">- ${currency.format(descuentoPromo)}</td>
        </tr>
      `;
    }

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
                ${deliveryOption === "ciudad" ? `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>Envío a Córdoba</strong>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">1</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currency.format(1000)}</td>
                </tr>
                ` : ''}
                ${ahorrosHTML}
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
            <h3>Ahorro por descuento aplicado:</h3>
            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #16a34a;"><strong>🎉 Código ${discountCode}</strong></p>
              <p style="margin: 0; color: #16a34a;">Ahorro: ${currency.format(discountAmount)}</p>
            </div>
            ` : ''}

            ${(() => {
              // Calcular descuento por promos
              const precioUnitario = 4000;
              const precioSinPromo = totalMixQty * precioUnitario;
              const costoEnvio = deliveryOption === "ciudad" ? 1000 : 0;
              
              // Calcular precio con promos aplicadas
              let precioConPromo = precioSinPromo;
              if (totalMixQty >= 15) {
                precioConPromo = 53000; // 15 mixs por $53.000 (ahorro de $7.000)
              } else if (totalMixQty >= 5) {
                precioConPromo = 18000; // 5 mixs por $18.000 (ahorro de $2.000)
              }
              
              const descuentoPromo = precioSinPromo - precioConPromo;
              
              let html = '';
              
              // Mostrar envío gratuito por separado (si aplica)
              if (costoEnvio > 0) {
                html += `
                <h3>Ahorro por envío gratuito:</h3>
                <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #16a34a;"><strong>🚚 Envío gratuito a Ciudad Universitaria</strong></p>
                  <p style="margin: 0; color: #16a34a;">Ahorro: ${currency.format(costoEnvio)}</p>
                </div>
                `;
              }
              
              // Mostrar ahorro por promos de cantidad (si aplica)
              if (descuentoPromo > 0) {
                html += `
                <h3>Ahorro por promos:</h3>
                <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #16a34a;"><strong>🎉 Promo por cantidad (${totalMixQty} mixs)</strong></p>
                  <p style="margin: 0; color: #16a34a;">Ahorro: ${currency.format(descuentoPromo)}</p>
                </div>
                `;
              }
              
              return html;
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
