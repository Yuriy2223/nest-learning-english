import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GrammarTopic } from './schemas/grammar-topic.schema';
import { GrammarRule } from './schemas/grammar-rule.schema';
import { UserGrammarRule } from './schemas/user-grammar-rules.schema';
import { CreateGrammarTopicDto } from './dto/create-grammar-topic.dto';
import { UpdateGrammarTopicDto } from './dto/update-grammar-topic.dto';
import { CreateGrammarRuleDto } from './dto/create-grammar-rule.dto';
import { UpdateGrammarRuleDto } from './dto/update-grammar-rule.dto';
import {
  GrammarTopicLean,
  GrammarRuleLean,
  UserGrammarRuleLean,
  GrammarTopicResponse,
  GrammarRuleResponse,
  GrammarRuleStatusResponse,
  GrammarRuleUpdateData,
} from './interfaces/grammar.interface';
import { GrammarQuestion } from './schemas/grammar-question.schema';
import { UserGrammarTest } from './schemas/user-grammar-test.schema';
import { SubmitTestDto } from './dto/submit-test.dto';
import { CreateGrammarQuestionDto } from './dto/create-grammar-question.dto';
import {
  GrammarQuestionLean,
  GrammarQuestionResponse,
  GrammarTestResultResponse,
} from './interfaces/grammar.interface';

@Injectable()
export class GrammarService {
  constructor(
    @InjectModel(GrammarTopic.name)
    private grammarTopicModel: Model<GrammarTopic>,
    @InjectModel(GrammarRule.name)
    private grammarRuleModel: Model<GrammarRule>,
    @InjectModel(UserGrammarRule.name)
    private userGrammarRuleModel: Model<UserGrammarRule>,
    @InjectModel(GrammarQuestion.name)
    private grammarQuestionModel: Model<GrammarQuestion>,
    @InjectModel(UserGrammarTest.name)
    private userGrammarTestModel: Model<UserGrammarTest>,
  ) {}

  async getTopics(userId: string): Promise<GrammarTopicResponse[]> {
    const topics = await this.grammarTopicModel.find().lean<GrammarTopicLean[]>();

    const topicsWithProgress = await Promise.all(
      topics.map(async (topic): Promise<GrammarTopicResponse> => {
        const totalItems = await this.grammarRuleModel.countDocuments({
          topicId: new Types.ObjectId(topic._id),
        });

        const ruleIds = await this.grammarRuleModel
          .find({
            topicId: new Types.ObjectId(topic._id),
          })
          .distinct('_id');

        const completedItems = await this.userGrammarRuleModel.countDocuments({
          userId: new Types.ObjectId(userId),
          ruleId: { $in: ruleIds },
          isCompleted: true,
        });

        return {
          id: String(topic._id),
          title: topic.title,
          description: topic.description,
          imageUrl: topic.imageUrl,
          totalItems,
          completedItems,
          difficulty: topic.difficulty,
        };
      }),
    );

    return topicsWithProgress;
  }

  async getTopicRules(topicId: string, userId: string): Promise<GrammarRuleResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const rules = await this.grammarRuleModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<GrammarRuleLean[]>();

    const ruleIds = rules.map((r) => new Types.ObjectId(r._id));

    const userRules = await this.userGrammarRuleModel
      .find({
        userId: new Types.ObjectId(userId),
        ruleId: { $in: ruleIds },
      })
      .lean<UserGrammarRuleLean[]>();

    const userRulesMap = new Map<string, boolean>(
      userRules.map((ur) => [String(ur.ruleId), ur.isCompleted]),
    );

    return rules.map(
      (rule): GrammarRuleResponse => ({
        id: String(rule._id),
        title: rule.title,
        description: rule.description,
        examples: rule.examples,
        topicId: topicId,
        isCompleted: userRulesMap.get(String(rule._id)) || false,
      }),
    );
  }

  async updateRuleStatus(
    ruleId: string,
    userId: string,
    isCompleted: boolean,
  ): Promise<GrammarRuleStatusResponse> {
    if (!Types.ObjectId.isValid(ruleId)) {
      throw new NotFoundException(`Невірний ID правила`);
    }

    const rule = await this.grammarRuleModel.findById(ruleId);

    if (!rule) {
      throw new NotFoundException(`Правило з ID ${ruleId} не знайдено`);
    }

    const userRule = await this.userGrammarRuleModel.findOne({
      userId: new Types.ObjectId(userId),
      ruleId: new Types.ObjectId(ruleId),
    });

    if (userRule) {
      userRule.isCompleted = isCompleted;
      userRule.updatedAt = new Date();
      await userRule.save();
    } else {
      await this.userGrammarRuleModel.create({
        userId: new Types.ObjectId(userId),
        ruleId: new Types.ObjectId(ruleId),
        isCompleted,
      });
    }

    return {
      ruleId,
      isCompleted,
      message: 'Статус правила оновлено успішно',
    };
  }

  async markTopicAsCompleted(topicId: string, userId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const rules = await this.grammarRuleModel.find({ topicId: new Types.ObjectId(topicId) });

    const bulkOps = rules.map((rule) => ({
      updateOne: {
        filter: {
          userId: new Types.ObjectId(userId),
          ruleId: rule._id,
        },
        update: {
          $set: {
            isCompleted: true,
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await this.userGrammarRuleModel.bulkWrite(bulkOps);
    }

    return {
      message: `Тему "${topic.title}" успішно завершено`,
    };
  }

  async createTopic(createTopicDto: CreateGrammarTopicDto): Promise<GrammarTopicResponse> {
    const topic = await this.grammarTopicModel.create(createTopicDto);

    return {
      id: String(topic._id),
      title: topic.title,
      description: topic.description,
      imageUrl: topic.imageUrl,
      totalItems: 0,
      completedItems: 0,
      difficulty: topic.difficulty,
    };
  }

  async updateTopic(
    topicId: string,
    updateTopicDto: UpdateGrammarTopicDto,
  ): Promise<GrammarTopicResponse> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findByIdAndUpdate(topicId, updateTopicDto, {
      new: true,
    });

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const totalItems = await this.grammarRuleModel.countDocuments({
      topicId: topic._id,
    });

    return {
      id: String(topic._id),
      title: topic.title,
      description: topic.description,
      imageUrl: topic.imageUrl,
      totalItems,
      completedItems: 0,
      difficulty: topic.difficulty,
    };
  }

  async deleteTopic(topicId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const topicObjectId = new Types.ObjectId(topicId);
    const ruleIds = await this.grammarRuleModel.find({ topicId: topicObjectId }).distinct('_id');

    if (ruleIds.length > 0) {
      await this.userGrammarRuleModel.deleteMany({ ruleId: { $in: ruleIds } });
    }

    await this.grammarRuleModel.deleteMany({ topicId: topicObjectId });
    await this.grammarTopicModel.findByIdAndDelete(topicId);

    return {
      message: `Тема "${topic.title}" та всі її правила успішно видалені`,
    };
  }

  async createRule(createRuleDto: CreateGrammarRuleDto): Promise<GrammarRuleResponse> {
    const { topicId, ...ruleData } = createRuleDto;

    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const rule = await this.grammarRuleModel.create({
      ...ruleData,
      topicId: new Types.ObjectId(topicId),
    });

    return {
      id: String(rule._id),
      title: rule.title,
      description: rule.description,
      examples: rule.examples,
      topicId: topicId,
    };
  }

  async updateRule(
    ruleId: string,
    updateRuleDto: UpdateGrammarRuleDto,
  ): Promise<GrammarRuleResponse> {
    if (!Types.ObjectId.isValid(ruleId)) {
      throw new NotFoundException(`Невірний ID правила`);
    }

    const updateData: GrammarRuleUpdateData = {};

    if (updateRuleDto.title !== undefined) {
      updateData.title = updateRuleDto.title;
    }
    if (updateRuleDto.description !== undefined) {
      updateData.description = updateRuleDto.description;
    }
    if (updateRuleDto.examples !== undefined) {
      updateData.examples = updateRuleDto.examples;
    }

    if (updateRuleDto.topicId) {
      if (!Types.ObjectId.isValid(updateRuleDto.topicId)) {
        throw new NotFoundException(`Невірний ID теми`);
      }

      const topic = await this.grammarTopicModel.findById(updateRuleDto.topicId);
      if (!topic) {
        throw new NotFoundException(`Тема з ID ${updateRuleDto.topicId} не знайдена`);
      }

      updateData.topicId = updateRuleDto.topicId;
    }

    const rule = await this.grammarRuleModel.findByIdAndUpdate(ruleId, updateData, { new: true });

    if (!rule) {
      throw new NotFoundException(`Правило з ID ${ruleId} не знайдено`);
    }

    return {
      id: String(rule._id),
      title: rule.title,
      description: rule.description,
      examples: rule.examples,
      topicId: rule.topicId.toString(),
    };
  }

  async deleteRule(ruleId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(ruleId)) {
      throw new NotFoundException(`Невірний ID правила`);
    }

    const rule = await this.grammarRuleModel.findById(ruleId);

    if (!rule) {
      throw new NotFoundException(`Правило з ID ${ruleId} не знайдено`);
    }

    const ruleObjectId = new Types.ObjectId(ruleId);
    await this.userGrammarRuleModel.deleteMany({ ruleId: ruleObjectId });
    await this.grammarRuleModel.findByIdAndDelete(ruleId);

    return {
      message: `Правило "${rule.title}" успішно видалено`,
    };
  }

  async getAllTopicsAdmin(q?: string): Promise<GrammarTopicResponse[]> {
    const filter: Record<string, any> = {};

    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }

    const topics = await this.grammarTopicModel.find(filter).lean<GrammarTopicLean[]>();

    const topicsWithCounts = await Promise.all(
      topics.map(async (topic): Promise<GrammarTopicResponse> => {
        const totalItems = await this.grammarRuleModel.countDocuments({
          topicId: new Types.ObjectId(topic._id),
        });

        return {
          id: String(topic._id),
          title: topic.title,
          description: topic.description,
          imageUrl: topic.imageUrl,
          totalItems,
          completedItems: 0,
          difficulty: topic.difficulty,
        };
      }),
    );

    return topicsWithCounts;
  }

  async getAllRulesAdmin(topicId: string): Promise<GrammarRuleResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const rules = await this.grammarRuleModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<GrammarRuleLean[]>();

    return rules.map(
      (rule): GrammarRuleResponse => ({
        id: String(rule._id),
        title: rule.title,
        description: rule.description,
        examples: rule.examples,
        topicId: topicId,
      }),
    );
  }

  async getTopicQuestions(topicId: string): Promise<GrammarQuestionResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const questions = await this.grammarQuestionModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<GrammarQuestionLean[]>();

    return questions.map((q) => ({
      id: String(q._id),
      question: q.question,
      options: q.options,
    }));
  }

  async submitTest(
    topicId: string,
    userId: string,
    submitTestDto: SubmitTestDto,
  ): Promise<GrammarTestResultResponse> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const questions = await this.grammarQuestionModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<GrammarQuestionLean[]>();

    if (questions.length === 0) {
      throw new NotFoundException(`Питання для цієї теми не знайдені`);
    }

    if (submitTestDto.answers.length !== questions.length) {
      throw new BadRequestException(
        `Кількість відповідей (${submitTestDto.answers.length}) не відповідає кількості питань (${questions.length})`,
      );
    }

    let score = 0;
    const correctAnswers = questions.map((q, index) => {
      const userAnswer = submitTestDto.answers[index];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) score++;

      return {
        questionId: String(q._id),
        correctAnswer: q.correctAnswer,
        userAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    await this.userGrammarTestModel.create({
      userId: new Types.ObjectId(userId),
      topicId: new Types.ObjectId(topicId),
      score,
      totalQuestions: questions.length,
      percentage,
      passed,
      completedAt: new Date(),
    });

    return {
      score,
      totalQuestions: questions.length,
      percentage,
      passed,
      correctAnswers,
    };
  }

  async createQuestion(createQuestionDto: CreateGrammarQuestionDto): Promise<{ message: string }> {
    const { topicId, ...questionData } = createQuestionDto;

    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    await this.grammarQuestionModel.create({
      ...questionData,
      topicId: new Types.ObjectId(topicId),
    });

    return { message: 'Питання успішно створено' };
  }

  async updateQuestion(
    questionId: string,
    updateQuestionDto: CreateGrammarQuestionDto,
  ): Promise<GrammarQuestionLean> {
    if (!Types.ObjectId.isValid(questionId)) {
      throw new NotFoundException(`Невірний ID питання`);
    }

    const { topicId, ...questionData } = updateQuestionDto;

    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.grammarTopicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const question = await this.grammarQuestionModel
      .findByIdAndUpdate(
        questionId,
        {
          ...questionData,
          topicId: new Types.ObjectId(topicId),
        },
        { new: true },
      )
      .lean<GrammarQuestionLean>();

    if (!question) {
      throw new NotFoundException(`Питання з ID ${questionId} не знайдено`);
    }

    return question;
  }

  async getTopicQuestionsAdmin(topicId: string): Promise<GrammarQuestionLean[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const questions = await this.grammarQuestionModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<GrammarQuestionLean[]>();

    return questions;
  }

  async deleteQuestion(questionId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(questionId)) {
      throw new NotFoundException(`Невірний ID питання`);
    }

    const question = await this.grammarQuestionModel.findByIdAndDelete(questionId);

    if (!question) {
      throw new NotFoundException(`Питання з ID ${questionId} не знайдено`);
    }

    return { message: 'Питання успішно видалено' };
  }
}
