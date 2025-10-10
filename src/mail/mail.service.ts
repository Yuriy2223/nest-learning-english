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
    const backendUrl = this.configService.get<string>('backend.url');
    const resetUrl = `${backendUrl}/api/auth/reset-redirect?token=${resetToken}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from'),
        to: email,
        subject: 'Відновлення пароля - Learning English',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                  line-height: 1.6; 
                  color: #333; 
                  margin: 0; 
                  padding: 0; 
                  background-color: #f5f5f5; 
                }
                .container { 
                  max-width: 600px; 
                  margin: 40px auto; 
                  background: white; 
                  border-radius: 12px; 
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
                  overflow: hidden;
                }
                .header { 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; 
                  padding: 40px 30px; 
                  text-align: center; 
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
                }
                .content { 
                  padding: 40px 30px; 
                }
                .content p {
                  font-size: 16px;
                  margin-bottom: 20px;
                  color: #555;
                }
                .button-container {
                  text-align: center;
                  margin: 35px 0;
                }
                .button { 
                  display: inline-block; 
                  padding: 16px 48px; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white !important; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  font-weight: 600; 
                  font-size: 16px;
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                  transition: transform 0.2s;
                }
                .button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
                }
                .info-box {
                  background: #f8f9ff;
                  border-left: 4px solid #667eea;
                  padding: 20px;
                  border-radius: 4px;
                  margin: 25px 0;
                }
                .info-box p {
                  margin: 0 0 10px 0;
                  font-size: 14px;
                  color: #666;
                }
                .info-box ul {
                  margin: 10px 0;
                  padding-left: 20px;
                }
                .info-box li {
                  font-size: 14px;
                  color: #666;
                  line-height: 1.8;
                }
                .warning { 
                  margin-top: 30px; 
                  padding: 20px; 
                  background: #fff3cd; 
                  border-left: 4px solid #ffc107; 
                  border-radius: 4px; 
                }
                .warning p {
                  margin: 0 0 10px 0;
                  font-weight: 600;
                  color: #856404;
                }
                .warning ul {
                  margin: 10px 0;
                  padding-left: 20px;
                }
                .warning li {
                  color: #856404;
                  line-height: 1.8;
                }
                .footer { 
                  text-align: center; 
                  padding: 30px 20px; 
                  color: #999; 
                  font-size: 13px; 
                  background: #f9f9f9; 
                  border-top: 1px solid #eee;
                }
                .footer p {
                  margin: 5px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Відновлення пароля</h1>
                </div>
                <div class="content">
                  <p><strong>Вітаємо!</strong></p>
                  <p>Ви отримали цей лист, оскільки запросили відновлення пароля для вашого акаунту в <strong>Learning English</strong>.</p>
                  
                  <div class="button-container">
                    <a href="${resetUrl}" class="button">Скинути пароль</a>
                  </div>
                  
                  <div class="info-box">
                    <p><strong>💡 Як це працює:</strong></p>
                    <ul>
                      <li>Натисніть кнопку вище</li>
                      <li>Якщо у вас встановлений застосунок - він відкриється автоматично</li>
                      <li>Якщо ні - ви зможете скинути пароль у браузері</li>
                    </ul>
                  </div>
                  
                  <div class="warning">
                    <p>⚠️ Важлива інформація:</p>
                    <ul>
                      <li>Це посилання дійсне протягом <strong>1 години</strong></li>
                      <li>Якщо ви не запитували відновлення пароля, просто проігноруйте цей лист</li>
                      <li>Ніколи не передавайте це посилання іншим особам</li>
                    </ul>
                  </div>
                </div>
                <div class="footer">
                  <p><strong>© ${new Date().getFullYear()} Learning English</strong></p>
                  <p>Це автоматичний лист. Будь ласка, не відповідайте на нього.</p>
                </div>
              </div>
            </body>
          </html>
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
    const backendUrl = this.configService.get<string>('backend.url');
    const verificationUrl = `${backendUrl}/api/auth/verify-email?userId=${userId}&token=${verificationToken}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from'),
        to: email,
        subject: 'Підтвердження Email - Learning English',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f5f5f5;
                }
                .container {
                  max-width: 600px;
                  margin: 40px auto;
                  background: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  overflow: hidden;
                }
                .header {
                  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                  color: white;
                  padding: 40px 30px;
                  text-align: center;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
                }
                .content {
                  padding: 40px 30px;
                }
                .button-container {
                  text-align: center;
                  margin: 35px 0;
                }
                .button {
                  display: inline-block;
                  padding: 16px 48px;
                  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                  color: white !important;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
                }
                .info {
                  background: #e8f5e9;
                  padding: 20px;
                  border-left: 4px solid #4CAF50;
                  border-radius: 4px;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  padding: 30px 20px;
                  color: #999;
                  font-size: 13px;
                  background: #f9f9f9;
                  border-top: 1px solid #eee;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✉️ Підтвердження Email</h1>
                </div>
                <div class="content">
                  <p><strong>Вітаємо в Learning English! 🎉</strong></p>
                  <p>Дякуємо за реєстрацію. Будь ласка, підтвердіть вашу електронну адресу, натиснувши на кнопку нижче:</p>
                  
                  <div class="button-container">
                    <a href="${verificationUrl}" class="button">Підтвердити Email</a>
                  </div>
                  
                  <div class="info">
                    <p><strong>ℹ️ Корисна інформація:</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>Посилання дійсне протягом <strong>24 годин</strong></li>
                      <li>Після підтвердження ви зможете увійти в систему</li>
                      <li>Якщо ви не реєструвалися, проігноруйте цей лист</li>
                    </ul>
                  </div>
                </div>
                <div class="footer">
                  <p><strong>© ${new Date().getFullYear()} Learning English</strong></p>
                  <p>Це автоматичний лист. Будь ласка, не відповідайте на нього.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }
}
