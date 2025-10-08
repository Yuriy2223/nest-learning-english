import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
    super({
      clientID: configService.get<string>('google.clientId') || '',
      clientSecret: configService.get<string>('google.clientSecret') || '',
      callbackURL: configService.get<string>('google.callbackUrl') || '',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const emails = profile.emails as GoogleEmail[] | undefined;
    const photos = profile.photos as GooglePhoto[] | undefined;

    const user = {
      email: emails?.[0]?.value || '',
      name: profile.displayName || '',
      avatar: photos?.[0]?.value,
      googleId: profile.id,
    };

    done(null, user);
  }
}
