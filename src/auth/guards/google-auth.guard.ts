// import { Injectable, ExecutionContext } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';

// @Injectable()
// export class GoogleAuthGuard extends AuthGuard('google') {
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const activate = (await super.canActivate(context)) as boolean;
//     const request = context.switchToHttp().getRequest<Express.Request>();
//     await super.logIn(request);
//     return activate;
//   }
// }
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const state = request.query.state as string | undefined;

    return {
      state: state || 'web',
      session: false,
    };
  }
}
