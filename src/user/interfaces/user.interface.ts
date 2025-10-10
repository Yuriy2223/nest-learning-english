export interface User {
  id: string;
  email: string;
  roles: string[];
  name?: string;
  avatar?: string;
  googleId?: string;
  isEmailVerified?: boolean;
}

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}
