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
    const resetUrl = `${backendUrl}/auth/reset-redirect?token=${resetToken}`;

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
    const verificationUrl = `${backendUrl}/auth/verify-email?userId=${userId}&token=${verificationToken}`;

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
                  <h1>Підтвердження Email</h1>
                </div>
                <div class="content">
                  <p><strong>Вітаємо в Learning English!</strong></p>
                  <p>Дякуємо за реєстрацію. Будь ласка, підтвердіть вашу електронну адресу, натиснувши на кнопку нижче:</p>
                  
                  <div class="button-container">
                    <a href="${verificationUrl}" class="button">Підтвердити Email</a>
                  </div>
                  
                  <div class="info">
                    <p><strong>Корисна інформація:</strong></p>
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

  generateEmailVerificationRedirectHtml(
    userId: string,
    token: string,
    isMobile: boolean,
    verificationSuccess: boolean,
    errorMessage: string = '',
  ): string {
    const deepLink = `learningenglish:///login`;
    const frontendUrl = this.configService.get<string>('frontend.url');
    const webUrl = `${frontendUrl}/login`;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${verificationSuccess ? 'Email підтверджено' : 'Помилка'} - Learning English</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background: linear-gradient(135deg, ${verificationSuccess ? '#4CAF50 0%, #45a049 100%' : '#f44336 0%, #d32f2f 100%'});
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .container {
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 500px;
        width: 100%;
        padding: 40px;
        text-align: center;
        animation: slideIn 0.3s ease-out;
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, ${verificationSuccess ? '#4CAF50 0%, #45a049 100%' : '#f44336 0%, #d32f2f 100%'});
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 30px;
        font-size: 40px;
        animation: scaleIn 0.5s ease-out 0.2s both;
      }
      @keyframes scaleIn {
        from {
          transform: scale(0);
        }
        to {
          transform: scale(1);
        }
      }
      h1 {
        color: #333;
        font-size: 24px;
        margin-bottom: 15px;
        font-weight: 600;
      }
      p {
        color: #666;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 30px;
      }
      .button {
        display: block;
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, ${verificationSuccess ? '#4CAF50 0%, #45a049 100%' : '#2196F3 0%, #1976D2 100%'});
        color: white;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        border: none;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        margin-bottom: 15px;
      }
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
      }
      .button:active {
        transform: translateY(0);
      }
      .error-details {
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
        color: #856404;
        font-size: 14px;
        text-align: left;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="icon">${verificationSuccess ? '✅' : '❌'}</div>
      <h1>${verificationSuccess ? 'Email підтверджено!' : 'Помилка підтвердження'}</h1>
      
      ${
        verificationSuccess
          ? `
        <p>Ваша електронна пошта успішно підтверджена. Тепер ви можете увійти у додаток.</p>
        ${
          isMobile
            ? `
          <button onclick="openApp()" class="button">
            Відкрити застосунок
          </button>
          <a href="${webUrl}" class="button" style="background: linear-gradient(135deg, #9E9E9E 0%, #757575 100%);">
             Відкрити веб-версію
          </a>
        `
            : `
          <a href="${webUrl}" class="button">
             Перейти до входу
          </a>
        `
        }
      `
          : `
        <div class="error-details">
          <strong>Деталі помилки:</strong><br>
          ${errorMessage || 'Невалідне посилання або термін дії минув'}
        </div>
        <p>Спробуйте запросити новий лист підтвердження або зв'яжіться з підтримкою.</p>
        <a href="${webUrl}" class="button">
          Повернутися до входу
        </a>
      `
      }
    </div>

    ${
      verificationSuccess && isMobile
        ? `
    <script>
      const deepLink = '${deepLink}';
      const webUrl = '${webUrl}';
      let appOpened = false;
      
      function openApp() {
     
        
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.location.href = deepLink;
          
          setTimeout(() => {
            if (!document.hidden && !appOpened) {
              alert('Застосунок не встановлений. Перенаправляємо на веб-версію...');
              window.location.href = webUrl;
            }
          }, 2500);
        } else if (/Android/i.test(navigator.userAgent)) {
          window.location.href = deepLink;
          setTimeout(() => {
            if (!document.hidden && !appOpened) {
        
              alert('Застосунок не встановлений. Перенаправляємо на веб-версію...');
              window.location.href = webUrl;
            }
          }, 2500);
        } else {
          window.location.href = webUrl;
        }
      }

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          appOpened = true;
          }
      });

      setTimeout(() => {
      openApp();
      }, 1000);
    </script>
    `
        : ''
    }
  </body>
</html>
`;
  }

  generateResetPasswordRedirectHtml(token: string, isMobile: boolean): string {
    const deepLink = `learningenglish://reset-password?token=${token}`;
    const frontendUrl = this.configService.get<string>('frontend.url');
    const webUrl = `${frontendUrl}/reset-password?token=${token}`;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Відновлення пароля - Learning English</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .container {
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 500px;
        width: 100%;
        padding: 40px;
        text-align: center;
      }
      .icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 30px;
        font-size: 40px;
      }
      h1 {
        color: #333;
        font-size: 24px;
        margin-bottom: 15px;
      }
      p {
        color: #666;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 30px;
      }
      .button {
        display: block;
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        border: none;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
      }
      .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .status {
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
        font-size: 14px;
        display: none;
      }
      .status-error {
        background: #f8d7da;
        color: #721c24;
      }
      @media (max-width: 480px) {
        .container { padding: 30px 20px; }
        h1 { font-size: 20px; }
        p { font-size: 14px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="icon">🔐</div>
      <h1>Відновлення пароля</h1>
      
      <div id="loading">
        <div class="loader"></div>
        <p>Відкриття застосунку...</p>
      </div>

      <div id="mobile-content" style="display: none;">
        <p>Застосунок не відкрився автоматично?</p>
        <button onclick="openApp()" class="button">
          Відкрити застосунок
        </button>
      </div>

      <div id="desktop-content" style="display: none;">
        <p>Натисніть кнопку нижче, щоб продовжити скидання пароля</p>
        <a href="${webUrl}" class="button">
          Скидання паролю
        </a>
      </div>

      <div id="status" class="status"></div>
    </div>

    <script>
      const deepLink = '${deepLink}';
      const webUrl = '${webUrl}';
      const isMobile = ${isMobile};
      let appOpened = false;
      
      function showStatus(message, type) {
        const status = document.getElementById('status');
        status.className = 'status status-' + type;
        status.textContent = message;
        status.style.display = 'block';
      }

      function openApp() {
          if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.location.href = deepLink;
          
          setTimeout(() => {
            if (!document.hidden && !appOpened) {
              showStatus('Застосунок не встановлений. Будь ласка, встановіть додаток із App Store.', 'error');
            }
          }, 2500);
        } else if (/Android/i.test(navigator.userAgent)) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = deepLink;
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
            if (!document.hidden && !appOpened) {
              showStatus('Застосунок не встановлений. Будь ласка, встановіть додаток із Google Play.', 'error');
            }
          }, 2500);
        }
      }

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          appOpened = true;
        }
      });

      if (isMobile) {
        setTimeout(() => {
          openApp();
          
          setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('mobile-content').style.display = 'block';
          }, 3000);
        }, 500);
      } else {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('desktop-content').style.display = 'block';
      }
    </script>
  </body>
</html>
`;
  }
}
