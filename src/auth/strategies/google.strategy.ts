// import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ConfigService } from '@nestjs/config';

// interface GoogleEmail {
//   value: string;
//   verified?: boolean;
// }

// interface GooglePhoto {
//   value: string;
// }

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
//   constructor(private readonly configService: ConfigService) {
//     const clientID = configService.get<string>('google.webClientId');
//     const clientSecret = configService.get<string>('google.clientSecret');
//     const callbackURL = configService.get<string>('google.callbackUrl');

//     if (!clientID || !clientSecret) {
//       throw new Error(
//         'Google OAuth configuration is missing. Check GOOGLE_WEB_CLIENT_ID and GOOGLE_CLIENT_SECRET',
//       );
//     }

//     super({
//       clientID,
//       clientSecret,
//       callbackURL,
//       scope: ['email', 'profile'],
//     });
//   }

//   validate(
//     accessToken: string,
//     refreshToken: string,
//     profile: Profile,
//     done: VerifyCallback,
//   ): void {
//     const emails = profile.emails as GoogleEmail[] | undefined;
//     const photos = profile.photos as GooglePhoto[] | undefined;

//     const user = {
//       email: emails?.[0]?.value || '',
//       name: profile.displayName || '',
//       avatar: photos?.[0]?.value,
//       googleId: profile.id,
//     };

//     done(null, user);
//   }
// }
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

interface GoogleEmail {
  value: string;
  verified?: boolean;
}

interface GooglePhoto {
  value: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('google.webClientId');
    const clientSecret = configService.get<string>('google.clientSecret');
    const callbackURL = configService.get<string>('google.callbackUrl');

    if (!clientID || !clientSecret) {
      throw new Error(
        'Google OAuth configuration is missing. Check GOOGLE_WEB_CLIENT_ID and GOOGLE_CLIENT_SECRET',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const emails = profile.emails as GoogleEmail[] | undefined;
    const photos = profile.photos as GooglePhoto[] | undefined;
    const state = req.query.state as string | undefined;

    const user = {
      email: emails?.[0]?.value || '',
      name: profile.displayName || '',
      avatar: photos?.[0]?.value,
      googleId: profile.id,
      state: state || 'web',
    };

    done(null, user);
  }
}
