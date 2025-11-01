import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { SignupDto } from './dto/signup.dto';
import { UsersService } from 'src/user/user.service';
import { TokensService } from 'src/token/token.service';
import { UserDocument } from 'src/user/schemas/user.schema';
import { GoogleUser } from 'src/user/interfaces/user.interface';
import { OAuth2Client } from 'google-auth-library';
import { AuthTokens } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('google.clientId'));
  }

  async signup(signupDto: SignupDto): Promise<{ message: string }> {
    const user = await this.usersService.create(
      signupDto.email,
      signupDto.password,
      signupDto.name,
    );

    const verificationToken = await this.tokensService.createEmailVerificationToken(
      user._id.toString(),
    );

    await this.mailService.sendEmailVerification(
      user.email,
      user._id.toString(),
      verificationToken,
    );

    return { message: 'User registered. Please verify your email.' };
  }

  async verifyEmail(userId: string, token: string): Promise<{ message: string }> {
    const isValid = await this.tokensService.validateEmailVerificationToken(userId, token);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.verifyEmail(userId);
    await this.tokensService.removeEmailVerificationToken(userId);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('Користувача з таким email не знайдено');
    }

    if (user.isEmailVerified) {
      return { message: 'Email вже підтверджено' };
    }

    const verificationToken = await this.tokensService.createEmailVerificationToken(
      user._id.toString(),
    );

    await this.mailService.sendEmailVerification(
      user.email,
      user._id.toString(),
      verificationToken,
    );

    return { message: 'Лист підтвердження відправлено повторно' };
  }

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isEmailVerified && !user.googleId) {
      throw new ForbiddenException('Please verify your email before signing in');
    }

    return user;
  }

  async signin(user: UserDocument): Promise<AuthTokens> {
    const tokens = await this.generateTokens(user);
    await this.tokensService.saveRefreshToken(user._id.toString(), tokens.refreshToken);
    return tokens;
  }

  // async googleLogin(googleUser: GoogleUser): Promise<AuthTokens> {
  //   let user = await this.usersService.findByGoogleId(googleUser.googleId);

  //   if (!user) {
  //     user = await this.usersService.findByEmail(googleUser.email);
  //     if (user) {
  //       user = await this.usersService.updateGoogleUser(
  //         user._id.toString(),
  //         googleUser.googleId,
  //         googleUser.name,
  //         googleUser.avatar,
  //       );
  //     } else {
  //       user = await this.usersService.createGoogleUser(
  //         googleUser.email,
  //         googleUser.googleId,
  //         googleUser.name,
  //         googleUser.avatar,
  //       );
  //     }
  //   }

  //   const tokens = await this.generateTokens(user);
  //   await this.tokensService.saveRefreshToken(user._id.toString(), tokens.refreshToken);
  //   return tokens;
  // }

  async googleLogin(googleUser: GoogleUser): Promise<AuthTokens> {
    const userWithState = googleUser as GoogleUser & { state?: string };
    const isAdmin = userWithState.state === 'admin';

    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.usersService.findByEmail(googleUser.email);

      if (user) {
        user = await this.usersService.updateGoogleUser(
          user._id.toString(),
          googleUser.googleId,
          googleUser.name,
          googleUser.avatar,
        );
      } else {
        if (isAdmin) {
          throw new UnauthorizedException('Користувач не знайдений');
        }

        user = await this.usersService.createGoogleUser(
          googleUser.email,
          googleUser.googleId,
          googleUser.name,
          googleUser.avatar,
        );
      }
    }

    if (isAdmin && !user.roles.includes('admin')) {
      throw new UnauthorizedException('Доступ заборонено. Потрібна роль адміністратора.');
    }

    const tokens = await this.generateTokens(user);
    await this.tokensService.saveRefreshToken(user._id.toString(), tokens.refreshToken);
    return tokens;
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const isValid = await this.tokensService.validateRefreshToken(userId, refreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(userId);
    const tokens = await this.generateTokens(user);
    await this.tokensService.saveRefreshToken(userId, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.tokensService.removeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If user exists, reset email will be sent' };
    }

    const resetToken = await this.tokensService.createResetPasswordToken(user._id.toString());

    await this.mailService.sendResetPasswordEmail(user.email, resetToken);

    return { message: 'If user exists, reset email will be sent' };
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    const isValid = await this.tokensService.validateResetPasswordToken(user._id.toString(), token);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.updatePassword(user._id.toString(), newPassword);

    if (!user.isEmailVerified) {
      await this.usersService.verifyEmail(user._id.toString());
    }

    await this.tokensService.removeResetPasswordToken(user._id.toString());

    return { message: 'Password reset successfully' };
  }

  async verifyGoogleToken(idToken: string): Promise<GoogleUser> {
    try {
      const webClientId = this.configService.get<string>('google.webClientId');
      const androidClientId = this.configService.get<string>('google.androidClientId');
      const audiences = [webClientId, androidClientId].filter((id): id is string => Boolean(id));
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audiences.length > 0 ? audiences : undefined,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar: payload.picture,
      };
    } catch (error) {
      console.error('Google token verification error:', error);
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  async getUserByEmail(email: string): Promise<UserDocument> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async generateTokens(user: UserDocument): Promise<AuthTokens> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(
        { sub: user._id.toString(), email: user.email },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
