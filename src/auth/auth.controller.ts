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

interface JwtPayloadUser {
  id: string;
  email: string;
  roles: string[];
}

interface RefreshPayloadUser extends JwtPayloadUser {
  refreshToken: string;
}

interface SigninResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user._id.toString(),
        name: user.name || user.email.split('@')[0],
        email: user.email,
        emailVerified: user.isEmailVerified,
      },
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const googleUser = req.user as GoogleUser;
    const tokens = await this.authService.googleLogin(googleUser);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: RefreshPayloadUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.authService.refresh(user.id, user.refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayloadUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id);

    res.clearCookie('refreshToken');

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
}
