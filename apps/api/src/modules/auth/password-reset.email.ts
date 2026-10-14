import type { MailMessage } from '../mail/mail.service';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function passwordResetEmail(firstName: string, to: string, link: string): MailMessage {
  const name = escapeHtml(firstName);
  const href = escapeHtml(link);

  return {
    to,
    subject: 'Restablece tu contraseña de CafeFlow',
    text: [
      `Hola ${firstName},`,
      '',
      'Recibimos una solicitud para restablecer tu contraseña. Abre este enlace para elegir una nueva:',
      link,
      '',
      'El enlace vence en 1 hora y solo puede usarse una vez.',
      'Si no fuiste tú, ignora este correo: tu contraseña no cambiará.',
    ].join('\n'),
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f5f1eb;font-family:Arial,Helvetica,sans-serif;color:#2b2118">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px">
          <tr><td>
            <h1 style="margin:0 0 16px;font-size:20px">Restablece tu contraseña</h1>
            <p style="margin:0 0 16px;line-height:1.5">Hola ${name}, recibimos una solicitud para restablecer tu contraseña de CafeFlow.</p>
            <p style="margin:0 0 24px">
              <a href="${href}" style="display:inline-block;background:#6f4e37;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">Elegir nueva contraseña</a>
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#6b5b4e">El enlace vence en 1 hora y solo puede usarse una vez.</p>
            <p style="margin:0;font-size:13px;color:#6b5b4e">Si no fuiste tú, ignora este correo: tu contraseña no cambiará.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
