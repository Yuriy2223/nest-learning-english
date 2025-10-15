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
import { PhrasesService } from './phrases.service';
import { UpdatePhraseDto } from './dto/update-phrase.dto';
import { CreatePhraseDto } from './dto/create-phrase.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdatePhraseStatusDto } from './dto/update-phrase-status.dto';

@Controller('phrases')
@UseGuards(JwtAuthGuard)
export class PhrasesController {
  constructor(private readonly phrasesService: PhrasesService) {}

  @Get('topics')
  async getTopics(@CurrentUser() user: UserDto) {
    return this.phrasesService.getTopics(user.id);
  }

  @Get('topics/:topicId/phrases')
  async getTopicPhrases(@Param('topicId') topicId: string, @CurrentUser() user: UserDto) {
    return this.phrasesService.getTopicPhrases(topicId, user.id);
  }

  @Patch(':phraseId/status')
  @HttpCode(HttpStatus.OK)
  async updatePhraseStatus(
    @Param('phraseId') phraseId: string,
    @Body() updatePhraseStatusDto: UpdatePhraseStatusDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.phrasesService.updatePhraseStatus(phraseId, user.id, updatePhraseStatusDto.isKnown);
  }

  @Get('admin/topics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllTopicsAdmin() {
    return this.phrasesService.getAllTopicsAdmin();
  }

  @Post('admin/topics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.phrasesService.createTopic(createTopicDto);
  }

  @Patch('admin/topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateTopic(@Param('topicId') topicId: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.phrasesService.updateTopic(topicId, updateTopicDto);
  }

  @Delete('admin/topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteTopic(@Param('topicId') topicId: string) {
    return this.phrasesService.deleteTopic(topicId);
  }

  @Get('admin/topics/:topicId/phrase')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllPhrasesAdmin(@Param('topicId') topicId: string) {
    return this.phrasesService.getAllPhrasesAdmin(topicId);
  }

  @Post('admin/phrase')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createPhrase(@Body() createPhraseDto: CreatePhraseDto) {
    return this.phrasesService.createPhrase(createPhraseDto);
  }

  @Patch('admin/phrase/:phraseId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updatePhrase(
    @Param('phraseId') phraseId: string,
    @Body() updatePhraseDto: UpdatePhraseDto,
  ) {
    return this.phrasesService.updatePhrase(phraseId, updatePhraseDto);
  }

  @Delete('admin/phrase/:phraseId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deletePhrase(@Param('phraseId') phraseId: string) {
    return this.phrasesService.deletePhrase(phraseId);
  }
}
