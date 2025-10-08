import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from './interfaces/user.interface';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    const fullUser = await this.usersService.findById(user.id);
    return {
      id: fullUser._id.toString(),
      email: fullUser.email,
      name: fullUser.name,
      avatar: fullUser.avatar,
      roles: fullUser.roles,
      googleId: fullUser.googleId,
      isEmailVerified: fullUser.isEmailVerified,
    };
  }
}
