import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtRefreshValidatedUser } from '../interfaces/auth.interface';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = JwtRefreshValidatedUser>(error: Error | null, user: TUser | false): TUser {
    if (error || !user) {
      throw error || new UnauthorizedException('Invalid or expired refresh token');
    }
    return user;
  }
}
