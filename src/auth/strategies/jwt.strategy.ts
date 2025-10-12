import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../user/user.service';
import { JwtPayload } from '../interfaces/auth.interface';
import { UserDto } from 'src/user/interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<UserDto> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      roles: user.roles,
      googleId: user.googleId,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
