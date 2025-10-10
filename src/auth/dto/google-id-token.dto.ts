import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleIdTokenDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
