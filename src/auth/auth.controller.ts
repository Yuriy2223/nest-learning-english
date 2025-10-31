import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserDocument } from 'src/user/schemas/user.schema';
import { GoogleUser } from 'src/user/interfaces/user.interface';
import { GoogleIdTokenDto } from './dto/google-id-token.dto';
import type {
  JwtPayloadUser,
  JwtRefreshValidatedUser,
  SigninResponse,
} from './interfaces/auth.interface';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private isMobileApp(req: Request): boolean {
    const platform = req.headers['x-platform'] || req.headers['x-app-platform'];
    if (platform === 'mobile' || platform === 'app') {
      return true;
    }
    const userAgent = req.headers['user-agent'] || '';
    return /ReactNative|Mobile App/i.test(userAgent);
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<{ message: string }> {
    return this.authService.signup(signupDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query() query: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(query.userId, query.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerificationEmail(resendVerificationDto.email);
  }

  @Post('signin')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  async signin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SigninResponse> {
    const user = req.user as UserDocument;
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isEmailVerified && !user.googleId) {
      throw new UnauthorizedException({
        message: 'Email не підтверджено. Перевірте вашу пошту.',
        emailVerified: false,
        email: user.email,
      });
    }

    const tokens = await this.authService.signin(user);
    const isMobile = this.isMobileApp(req);

    if (!isMobile) {
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        user: {
          id: user._id.toString(),
          name: user.name || user.email.split('@')[0],
          email: user.email,
          emailVerified: user.isEmailVerified,
          roles: user.roles,
        },
      };
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name || user.email.split('@')[0],
        email: user.email,
        emailVerified: user.isEmailVerified,
        roles: user.roles,
      },
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const googleUser = req.user as GoogleUser;
      if (!googleUser) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      const tokens = await this.authService.googleLogin(googleUser);
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuthMobile(
    @Body() googleIdTokenDto: GoogleIdTokenDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<SigninResponse> {
    const googleUser = await this.authService.verifyGoogleToken(googleIdTokenDto.idToken);
    const tokens = await this.authService.googleLogin(googleUser);
    const isMobile = this.isMobileApp(req);
    const user = await this.authService.getUserByEmail(googleUser.email);

    if (!isMobile) {
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        user: {
          id: user._id.toString(),
          name: user.name || user.email.split('@')[0],
          email: user.email,
          emailVerified: true,
          roles: user.roles,
        },
      };
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name || user.email.split('@')[0],
        email: user.email,
        emailVerified: true,
        roles: user.roles,
      },
    };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: JwtRefreshValidatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const isMobile = this.isMobileApp(req);
    const tokens = await this.authService.refresh(user.id, user.refreshToken);

    if (!isMobile) {
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
      };
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayloadUser,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    const isMobile = this.isMobileApp(req);

    if (!isMobile) {
      res.clearCookie('refreshToken');
    }

    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Get('reset-redirect')
  resetRedirect(@Query('token') token: string, @Req() req: Request, @Res() res: Response): void {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const deepLink = `learningenglish://reset-password?token=${token}`;
    // const webUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const frontendUrl = this.configService.get<string>('frontend.url');
    const webUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
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

        <!-- Для мобільних: тільки кнопка додатку -->
        <div id="mobile-content" style="display: none;">
          <p>Застосунок не відкрився автоматично?</p>
          <button onclick="openApp()" class="button">
            📱 Відкрити застосунок
          </button>
        </div>

        <!-- Для десктопу: тільки кнопка веб-версії -->
        <div id="desktop-content" style="display: none;">
          <p>Натисніть кнопку нижче, щоб продовжити скидання пароля</p>
          <a href="${webUrl}" class="button">
            🌐 Скидання паролю
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
          console.log('Attempting to open deep link:', deepLink);
          
          // Для iOS
          if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.location.href = deepLink;
            
            setTimeout(() => {
              if (!document.hidden && !appOpened) {
                showStatus('Застосунок не встановлений. Будь ласка, встановіть додаток із App Store.', 'error');
              }
            }, 2500);
          } 
          // Для Android
          else if (/Android/i.test(navigator.userAgent)) {
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

        // Визначаємо чи додаток відкрився
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            appOpened = true;
          }
        });

        // Логіка для мобільних
        if (isMobile) {
          setTimeout(() => {
            openApp();
            
            // Показуємо кнопку через 3 секунди
            setTimeout(() => {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('mobile-content').style.display = 'block';
            }, 3000);
          }, 500);
        } 
        // Логіка для десктопу
        else {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('desktop-content').style.display = 'block';
        }
      </script>
    </body>
  </html>
  `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Security-Policy', "script-src 'unsafe-inline' 'self'");
    res.send(html);
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
