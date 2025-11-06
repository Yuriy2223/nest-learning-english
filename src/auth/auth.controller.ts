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
import { MailService } from '../mail/mail.service';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
    private readonly mailService: MailService,
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
  async verifyEmailRedirect(
    @Query('userId') userId: string,
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

    let verificationSuccess = false;
    let errorMessage = '';

    try {
      await this.authService.verifyEmail(userId, token);
      verificationSuccess = true;
    } catch (error) {
      verificationSuccess = false;
      errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
    }

    const html = this.mailService.generateEmailVerificationRedirectHtml(
      userId,
      token,
      isMobile,
      verificationSuccess,
      errorMessage,
    );

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Security-Policy', "script-src 'unsafe-inline' 'self'");
    res.send(html);
  }

  @Get('verify-email-api')
  async verifyEmailApi(
    @Query('userId') userId: string,
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(userId, token);
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
        const adminUrl = this.configService.get<string>('admin.url');
        return res.redirect(`${adminUrl}/login?error=auth_failed`);
      }

      const tokens = await this.authService.googleLogin(googleUser);
      this.setRefreshTokenCookie(res, tokens.refreshToken);
      const adminUrl = this.configService.get<string>('admin.url');

      res.redirect(`${adminUrl}/login?googleToken=${tokens.accessToken}`);
    } catch (error) {
      const adminUrl = this.configService.get<string>('admin.url');

      let errorMessage = 'server_error';

      if (error instanceof UnauthorizedException) {
        const response = error.getResponse();
        const message =
          typeof response === 'object' && response !== null && 'message' in response
            ? String(response.message)
            : '';

        if (message.includes('не знайдений')) {
          errorMessage = 'user_not_found';
        } else if (message.includes('адміністратора')) {
          errorMessage = 'not_admin';
        }
      }

      res.redirect(`${adminUrl}/login?error=${errorMessage}`);
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

    const html = this.mailService.generateResetPasswordRedirectHtml(token, isMobile);

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
