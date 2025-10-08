import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  googleId?: string;

  @IsArray()
  @IsOptional()
  roles?: string[];

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;
}
