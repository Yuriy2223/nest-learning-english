import { IsString, MinLength, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
