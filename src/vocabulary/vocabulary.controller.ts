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
import { UpdateWordStatusDto } from './dto/update-word-status.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import type { UserDto } from '../user/interfaces/user.interface';
import { VocabularyService } from './vocabulary.service';

@Controller('vocabulary')
@UseGuards(JwtAuthGuard)
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get('topics')
  async getTopics(@CurrentUser() user: UserDto) {
    return this.vocabularyService.getTopics(user.id);
  }

  @Get('topics/:topicId/words')
  async getTopicWords(@Param('topicId') topicId: string, @CurrentUser() user: UserDto) {
    return this.vocabularyService.getTopicWords(topicId, user.id);
  }

  @Patch('words/:wordId/status')
  @HttpCode(HttpStatus.OK)
  async updateWordStatus(
    @Param('wordId') wordId: string,
    @Body() updateWordStatusDto: UpdateWordStatusDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.vocabularyService.updateWordStatus(wordId, user.id, updateWordStatusDto.isKnown);
  }

  @Get('admin/topics/:topicId/words')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllWordsAdmin(@Param('topicId') topicId: string) {
    return this.vocabularyService.getAllWordsAdmin(topicId);
  }

  @Get('admin/topics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllTopicsAdmin() {
    return this.vocabularyService.getAllTopicsAdmin();
  }

  @Post('admin/topics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.vocabularyService.createTopic(createTopicDto);
  }

  @Patch('admin/topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateTopic(@Param('topicId') topicId: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.vocabularyService.updateTopic(topicId, updateTopicDto);
  }

  @Delete('admin/topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteTopic(@Param('topicId') topicId: string) {
    return this.vocabularyService.deleteTopic(topicId);
  }

  @Post('admin/words')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createWord(@Body() createWordDto: CreateWordDto) {
    return this.vocabularyService.createWord(createWordDto);
  }

  @Patch('admin/words/:wordId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateWord(@Param('wordId') wordId: string, @Body() updateWordDto: UpdateWordDto) {
    return this.vocabularyService.updateWord(wordId, updateWordDto);
  }

  @Delete('admin/words/:wordId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteWord(@Param('wordId') wordId: string) {
    return this.vocabularyService.deleteWord(wordId);
  }
}
