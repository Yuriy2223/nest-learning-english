import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { UserDto, UserPublicDto } from './interfaces/user.interface';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateStudyTimeDto } from './dto/update-study-time.dto';
import { AchievementsService } from 'src/achievements/achievements.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly achievementsService: AchievementsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: UserDto): Promise<UserPublicDto> {
    const fullUser = await this.usersService.findById(user.id);
    return {
      id: fullUser._id.toString(),
      email: fullUser.email,
      name: fullUser.name,
      avatar: fullUser.avatar,
      totalStudySeconds: fullUser.totalStudySeconds,
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

  @Post('study-time')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateStudyTime(
    @CurrentUser() user: UserDto,
    @Body() body: UpdateStudyTimeDto,
  ): Promise<{ success: boolean; totalStudySeconds: number }> {
    const updatedUser = await this.usersService.updateStudyTime(user.id, body.seconds);
    return {
      success: true,
      totalStudySeconds: updatedUser.totalStudySeconds,
    };
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  async getUserProgress(@CurrentUser() user: UserDto) {
    await this.usersService.updateStreak(user.id);
    return this.achievementsService.calculateUserStats(user.id);
  }

  @Delete('progress/reset')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resetProgress(@CurrentUser() user: UserDto) {
    await this.achievementsService.resetUserAchievements(user.id);
    return this.usersService.resetProgress(user.id);
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
