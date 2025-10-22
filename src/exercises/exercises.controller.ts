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
import { ExercisesService } from './exercises.service';
import { CreateTopicExerciseDto } from './dto/create-topic-exercise.dto';
import { UpdateTopicExerciseDto } from './dto/update-topic-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { SubmitExerciseDto } from './dto/submit-exercise.dto';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('topics')
  async getTopics(@CurrentUser() user: UserDto) {
    return this.exercisesService.getTopics(user.id);
  }

  @Get('topics/:topicId/exercises')
  async getTopicExercises(@Param('topicId') topicId: string) {
    return this.exercisesService.getTopicExercises(topicId);
  }

  @Post(':exerciseId/submit')
  @HttpCode(HttpStatus.OK)
  async submitExerciseAnswer(
    @Param('exerciseId') exerciseId: string,
    @Body() submitExerciseDto: SubmitExerciseDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.exercisesService.submitExerciseAnswer(
      exerciseId,
      user.id,
      submitExerciseDto.answer,
      submitExerciseDto.isCorrect,
      submitExerciseDto.earnedPoints,
    );
  }

  @Get('admin/topics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllTopicsAdmin() {
    return this.exercisesService.getAllTopicsAdmin();
  }

  @Post('admin/topics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createTopic(@Body() createTopicDto: CreateTopicExerciseDto) {
    return this.exercisesService.createTopic(createTopicDto);
  }

  @Patch('admin/topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateTopic(
    @Param('topicId') topicId: string,
    @Body() updateTopicDto: UpdateTopicExerciseDto,
  ) {
    return this.exercisesService.updateTopic(topicId, updateTopicDto);
  }

  @Delete('admin/topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteTopic(@Param('topicId') topicId: string) {
    return this.exercisesService.deleteTopic(topicId);
  }

  @Get('admin/topics/:topicId/exercises')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllExercisesAdmin(@Param('topicId') topicId: string) {
    return this.exercisesService.getAllExercisesAdmin(topicId);
  }

  @Post('admin/exercises')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createExercise(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.createExercise(createExerciseDto);
  }

  @Patch('admin/exercises/:exerciseId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateExercise(
    @Param('exerciseId') exerciseId: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exercisesService.updateExercise(exerciseId, updateExerciseDto);
  }

  @Delete('admin/exercises/:exerciseId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteExercise(@Param('exerciseId') exerciseId: string) {
    return this.exercisesService.deleteExercise(exerciseId);
  }
}
