import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDto } from '../user/interfaces/user.interface';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getUserAchievements(@CurrentUser() user: UserDto) {
    return this.achievementsService.getUserAchievements(user.id);
  }

  @Get('stats')
  async getUserStats(@CurrentUser() user: UserDto) {
    return this.achievementsService.calculateUserStats(user.id);
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkAchievements(@CurrentUser() user: UserDto) {
    return this.achievementsService.checkAndUnlockAchievements(user.id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createAchievement(@Body() createAchievementDto: CreateAchievementDto) {
    return this.achievementsService.createAchievement(createAchievementDto);
  }

  @Patch('admin/:achievementId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateAchievement(
    @Param('achievementId') achievementId: string,
    @Body() updateAchievementDto: UpdateAchievementDto,
  ) {
    return this.achievementsService.updateAchievement(achievementId, updateAchievementDto);
  }

  @Delete('admin/:achievementId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteAchievement(@Param('achievementId') achievementId: string) {
    return this.achievementsService.deleteAchievement(achievementId);
  }
}
