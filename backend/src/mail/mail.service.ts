import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function obtenerConfigMail(): MailConfig | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@psicometrico.com',
  };
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transport: nodemailer.Transporter | null = null;

  private obtenerTransport(): nodemailer.Transporter | null {
    const config = obtenerConfigMail();
    if (!config) return null;
    if (!this.transport) {
      this.transport = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      });
    }
    return this.transport;
  }

  async enviarCorreo(to: string, subject: string, html: string): Promise<boolean> {
    const transport = this.obtenerTransport();
    const config = obtenerConfigMail();
    if (!transport || !config) {
      this.logger.warn('SMTP no configurado, no se envió el correo');
      return false;
    }
    try {
      await transport.sendMail({
        from: config.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Correo enviado a ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Error al enviar correo a ${to}: ${(err as Error).message}`);
      return false;
    }
  }
}
