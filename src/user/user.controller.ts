import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { UserDto, UserPublicDto } from './interfaces/user.interface';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: UserDto): Promise<UserPublicDto> {
    const fullUser = await this.usersService.findById(user.id);
    return {
      id: fullUser._id.toString(),
      email: fullUser.email,
      name: fullUser.name,
      avatar: fullUser.avatar,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: UserDto,
    @Body() updateData: { name?: string; avatar?: string },
  ): Promise<UserDto> {
    return this.usersService.updateProfile(user.id, updateData);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllUsers(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @Patch(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateUserRoles(@Body() body: { userId: string; roles: string[] }): Promise<UserDto> {
    return this.usersService.updateRoles(body.userId, body.roles);
  }
}
