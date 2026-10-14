import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    this.from = config.get<string>('MAIL_FROM') || 'CafeFlow <no-reply@cafeflow.app>';
    this.isProduction = config.get<string>('NODE_ENV') === 'production';

    const host = config.get<string>('SMTP_HOST');
    if (!host) {
      this.transporter = null;
      if (this.isProduction) {
        this.logger.error('SMTP_HOST no configurado: no se enviarán correos');
      }
      return;
    }

    const user = config.get<string>('SMTP_USER');
    this.transporter = createTransport({
      host,
      port: Number(config.get<string>('SMTP_PORT') ?? 587),
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: user ? { user, pass: config.get<string>('SMTP_PASS') ?? '' } : undefined,
    });
  }

  /** Lanza si el proveedor rechaza el envío; el llamador decide si es fatal. */
  async send(message: MailMessage): Promise<void> {
    if (!this.transporter) {
      // El cuerpo puede contener enlaces de un solo uso: jamás a los logs de producción.
      if (!this.isProduction) {
        this.logger.warn(
          `[correo sin SMTP] Para: ${message.to}\nAsunto: ${message.subject}\n${message.text}`,
        );
      }
      return;
    }

    await this.transporter.sendMail({ from: this.from, ...message });
  }
}
