import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserDto } from '../../user/interfaces/user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = UserDto>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
