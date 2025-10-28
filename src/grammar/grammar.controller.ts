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
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDto } from '../user/interfaces/user.interface';
import { GrammarService } from './grammar.service';
import { CreateGrammarTopicDto } from './dto/create-grammar-topic.dto';
import { UpdateGrammarTopicDto } from './dto/update-grammar-topic.dto';
import { CreateGrammarRuleDto } from './dto/create-grammar-rule.dto';
import { UpdateGrammarRuleDto } from './dto/update-grammar-rule.dto';
import { UpdateRuleStatusDto } from './dto/update-rule-status.dto';
import { SubmitTestDto } from './dto/submit-test.dto';
import { CreateGrammarQuestionDto } from './dto/create-grammar-question.dto';

@Controller('grammar')
@UseGuards(JwtAuthGuard)
export class GrammarController {
  constructor(private readonly grammarService: GrammarService) {}

  @Get('topics')
  async getTopics(@CurrentUser() user: UserDto) {
    return this.grammarService.getTopics(user.id);
  }

  @Get('topics/:topicId/rules')
  async getTopicRules(@Param('topicId') topicId: string, @CurrentUser() user: UserDto) {
    return this.grammarService.getTopicRules(topicId, user.id);
  }

  @Patch('rules/:ruleId/status')
  @HttpCode(HttpStatus.OK)
  async updateRuleStatus(
    @Param('ruleId') ruleId: string,
    @Body() updateRuleStatusDto: UpdateRuleStatusDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.grammarService.updateRuleStatus(ruleId, user.id, updateRuleStatusDto.isCompleted);
  }

  @Post('topics/:topicId/complete')
  @HttpCode(HttpStatus.OK)
  async markTopicAsCompleted(@Param('topicId') topicId: string, @CurrentUser() user: UserDto) {
    return this.grammarService.markTopicAsCompleted(topicId, user.id);
  }

  @Get('topics/:topicId/questions')
  async getTopicQuestions(@Param('topicId') topicId: string) {
    return this.grammarService.getTopicQuestions(topicId);
  }

  @Post('topics/:topicId/submit-test')
  @HttpCode(HttpStatus.OK)
  async submitTest(
    @Param('topicId') topicId: string,
    @Body() submitTestDto: SubmitTestDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.grammarService.submitTest(topicId, user.id, submitTestDto);
  }

  @Get('admin/topics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  // async getAllTopicsAdmin() {
  //   return this.grammarService.getAllTopicsAdmin();
  async getAllTopicsAdmin(@Query('q') q?: string) {
    return this.grammarService.getAllTopicsAdmin(q);
  }

  @Post('admin/topics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createTopic(@Body() createTopicDto: CreateGrammarTopicDto) {
    return this.grammarService.createTopic(createTopicDto);
  }

  @Patch('admin/topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateTopic(
    @Param('topicId') topicId: string,
    @Body() updateTopicDto: UpdateGrammarTopicDto,
  ) {
    return this.grammarService.updateTopic(topicId, updateTopicDto);
  }

  @Delete('admin/topics/:topicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteTopic(@Param('topicId') topicId: string) {
    return this.grammarService.deleteTopic(topicId);
  }

  @Get('admin/topics/:topicId/rules')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllRulesAdmin(@Param('topicId') topicId: string) {
    return this.grammarService.getAllRulesAdmin(topicId);
  }

  @Post('admin/rules')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createRule(@Body() createRuleDto: CreateGrammarRuleDto) {
    return this.grammarService.createRule(createRuleDto);
  }

  @Patch('admin/rules/:ruleId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateRule(@Param('ruleId') ruleId: string, @Body() updateRuleDto: UpdateGrammarRuleDto) {
    return this.grammarService.updateRule(ruleId, updateRuleDto);
  }

  @Delete('admin/rules/:ruleId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteRule(@Param('ruleId') ruleId: string) {
    return this.grammarService.deleteRule(ruleId);
  }

  @Get('admin/topics/:topicId/questions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getTopicQuestionsAdmin(@Param('topicId') topicId: string) {
    return this.grammarService.getTopicQuestionsAdmin(topicId);
  }

  @Post('admin/questions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(@Body() createQuestionDto: CreateGrammarQuestionDto) {
    return this.grammarService.createQuestion(createQuestionDto);
  }

  @Patch('admin/questions/:questionId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: CreateGrammarQuestionDto,
  ) {
    return this.grammarService.updateQuestion(questionId, updateQuestionDto);
  }

  @Delete('admin/questions/:questionId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.grammarService.deleteQuestion(questionId);
  }
}
