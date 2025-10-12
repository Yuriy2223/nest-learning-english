import { IsString, IsArray, IsIn } from 'class-validator';

export class UpdateUserRolesDto {
  @IsArray()
  @IsString({ each: true })
  @IsIn(['user', 'admin', 'moderator'], { each: true })
  roles: string[];
}
