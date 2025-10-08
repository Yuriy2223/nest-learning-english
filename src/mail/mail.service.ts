import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: true,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.password'),
      },
    });
  }

  async sendResetPasswordEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('frontend.url')}/reset-password?token=${resetToken}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from'),
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
      this.logger.log(`Reset password email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset password email to ${email}`, error);
      throw error;
    }
  }

  async sendEmailVerification(
    email: string,
    userId: string,
    verificationToken: string,
  ): Promise<void> {
    const backendUrl = this.configService.get<string>('backend.url') || 'http://localhost:3000';
    const verificationUrl = `${backendUrl}/api/auth/verify-email?userId=${userId}&token=${verificationToken}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from'),
        to: email,
        subject: 'Email Verification',
        html: `
          <h1>Email Verification</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }
}
