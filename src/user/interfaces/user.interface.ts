export interface UserDto {
  id: string;
  email: string;
  roles: string[];
  name?: string;
  avatar?: string;
  googleId?: string;
  isEmailVerified?: boolean;
  totalStudySeconds?: number;
  streak?: number;
  points?: number;
}

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface UserPublicDto {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  googleId?: string;
  isEmailVerified?: boolean;
  totalStudySeconds?: number;
  streak?: number;
  points?: number;
}
