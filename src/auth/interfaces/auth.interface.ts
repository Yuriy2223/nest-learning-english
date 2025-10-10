export interface JwtPayloadUser {
  id: string;
  email: string;
  roles: string[];
}

export interface RefreshPayloadUser extends JwtPayloadUser {
  refreshToken: string;
}

export interface SigninResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
}

export interface JwtRefreshPayload {
  sub: string;
  email: string;
}

export interface JwtRefreshValidatedUser {
  id: string;
  email: string;
  refreshToken: string;
}
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
