import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokensService } from 'src/token/token.service';
import type { JwtRefreshPayload, JwtRefreshValidatedUser } from '../interfaces/auth.interface';

interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
  body: {
    refreshToken?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokensService: TokensService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => (request as RequestWithCookies).cookies.refreshToken ?? null,

        (request: Request) => (request as RequestWithCookies).body.refreshToken ?? null,
      ]),
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
      ignoreExpiration: false,
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: JwtRefreshPayload): Promise<JwtRefreshValidatedUser> {
    const request = req as RequestWithCookies;
    const refreshToken = request.cookies.refreshToken ?? request.body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isValid = await this.tokensService.validateRefreshToken(payload.sub, refreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Refresh token has been revoked or is invalid');
    }

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
