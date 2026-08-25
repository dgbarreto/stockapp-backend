import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class PasswordResetEmailService {
  private readonly logger = new Logger(PasswordResetEmailService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendResetCode(to: string, code: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'Bufunfa+ <onboarding@resend.dev>',
        to,
        subject: 'Seu código para redefinir a senha',
        html: `
          <p>Use o código abaixo para redefinir sua senha no Bufunfa+.</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
          <p>Ele expira em 15 minutos. Se você não pediu essa redefinição, ignore este e-mail.</p>
        `,
      });
    } catch (error) {
      // Nunca deixa o erro de envio vazar pro caller: forgot-password sempre
      // responde a mesma mensagem genérica, exista o e-mail ou não, e falhe
      // o envio ou não — evita qualquer sinal que diferencie os casos.
      this.logger.error('Failed to send password reset email', error);
    }
  }
}