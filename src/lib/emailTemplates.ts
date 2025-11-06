export function buildGenericEmailHtml(opts: { title?: string; name?: string; contentHtml: string; }) {
  const { title, name, contentHtml } = opts;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #fbbf24; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; color: white; font-size: 20px;">⚡ Moovimiento</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
        ${title ? `<h1 style="font-size: 24px; color: #fbbf24; margin-bottom: 4px;">${title}</h1>` : ''}
        <p style="font-size: 16px; margin: 0 0 12px 0;">Hola${name ? ` ${name}` : ''}! 👋</p>

        <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 16px; margin: 10px 0 20px 0; border-radius: 4px;">
          ${contentHtml}
        </div>

        <p style="margin-top: 20px; font-size: 14px; color: #666;">Si tenés alguna duda escribinos a <a href="mailto:gonza@moovimiento.com">gonza@moovimiento.com</a></p>

        <p style="margin-top: 10px; font-size: 14px; color: #666;">¡Gracias por confiar en nosotros! ⚡<br>Gonza</p>
      </div>
    </div>
  `;
}

export default buildGenericEmailHtml;
