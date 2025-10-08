import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
}

export interface JwtRefreshValidatedUser {
  id: string;
  email: string;
  refreshToken: string;
}

interface RequestWithCookies extends Request {
  cookies: {
    refreshToken?: string;
  };
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const req = request as RequestWithCookies;
          return req?.cookies?.refreshToken || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload): JwtRefreshValidatedUser {
    const request = req as RequestWithCookies;
    const refreshToken = request.cookies?.refreshToken || '';

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
