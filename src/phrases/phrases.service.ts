import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TopicPhrase } from './schemas/topic.schema';
import { UserPhrase } from './schemas/user-phrases.schema';
import { Phrase } from './schemas/phrase.schema';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { UpdatePhraseDto } from './dto/update-phrase.dto';
import { CreatePhraseDto } from './dto/create-phrase.dto';
import {
  PhraseLean,
  PhraseResponse,
  PhraseStatusResponse,
  PhraseUpdateData,
  TopicLean,
  TopicResponse,
  UserPhraseLean,
} from './interfaces/phrases.interface';

@Injectable()
export class PhrasesService {
  constructor(
    @InjectModel(TopicPhrase.name)
    private topicModel: Model<TopicPhrase>,
    @InjectModel(Phrase.name)
    private phraseModel: Model<Phrase>,
    @InjectModel(UserPhrase.name)
    private userPhraseModel: Model<UserPhrase>,
  ) {}

  async getTopics(userId: string): Promise<TopicResponse[]> {
    const topics = await this.topicModel.find().lean<TopicLean[]>();

    const topicsWithProgress = await Promise.all(
      topics.map(async (topic): Promise<TopicResponse> => {
        const totalItems = await this.phraseModel.countDocuments({
          topicId: new Types.ObjectId(topic._id),
        });

        const phraseIds = await this.phraseModel
          .find({
            topicId: new Types.ObjectId(topic._id),
          })
          .distinct('_id');

        const completedItems = await this.userPhraseModel.countDocuments({
          userId: new Types.ObjectId(userId),
          phraseId: { $in: phraseIds },
          isKnown: true,
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

  async getTopicPhrases(topicId: string, userId: string): Promise<PhraseResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicModel.findById(topicId);

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const phrases = await this.phraseModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<PhraseLean[]>();

    const phraseIds = phrases.map((w) => new Types.ObjectId(w._id));

    const userPhrases = await this.userPhraseModel
      .find({
        userId: new Types.ObjectId(userId),
        phraseId: { $in: phraseIds },
      })
      .lean<UserPhraseLean[]>();

    const userPhrasesMap = new Map<string, boolean>(
      userPhrases.map((uw) => [String(uw.phraseId), uw.isKnown]),
    );

    return phrases.map(
      (phrase): PhraseResponse => ({
        id: String(phrase._id),
        phrase: phrase.phrase,
        translation: phrase.translation,
        audioUrl: phrase.audioUrl,
        topicId: topicId,
        isKnown: userPhrasesMap.get(String(phrase._id)) || false,
      }),
    );
  }

  async updatePhraseStatus(
    phraseId: string,
    userId: string,
    isKnown: boolean,
  ): Promise<PhraseStatusResponse> {
    if (!Types.ObjectId.isValid(phraseId)) {
      throw new NotFoundException(`Невірний ID фрази`);
    }

    const phrase = await this.phraseModel.findById(phraseId);

    if (!phrase) {
      throw new NotFoundException(`Фраза з ID ${phraseId} не знайдена`);
    }

    const userPhrase = await this.userPhraseModel.findOne({
      userId: new Types.ObjectId(userId),
      phraseId: new Types.ObjectId(phraseId),
    });

    if (userPhrase) {
      userPhrase.isKnown = isKnown;
      userPhrase.updatedAt = new Date();
      await userPhrase.save();
    } else {
      await this.userPhraseModel.create({
        userId: new Types.ObjectId(userId),
        phraseId: new Types.ObjectId(phraseId),
        isKnown,
      });
    }

    return {
      phraseId,
      isKnown,
      message: 'Статус фрази оновлено успішно',
    };
  }

  async createTopic(createTopicDto: CreateTopicDto): Promise<TopicResponse> {
    const topic = await this.topicModel.create(createTopicDto);

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

  async updateTopic(topicId: string, updateTopicDto: UpdateTopicDto): Promise<TopicResponse> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicModel.findByIdAndUpdate(topicId, updateTopicDto, { new: true });

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const totalItems = await this.phraseModel.countDocuments({
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

    const topic = await this.topicModel.findById(topicId);

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const topicObjectId = new Types.ObjectId(topicId);
    const phraseIds = await this.phraseModel.find({ topicId: topicObjectId }).distinct('_id');

    if (phraseIds.length > 0) {
      await this.userPhraseModel.deleteMany({ phraseId: { $in: phraseIds } });
    }

    await this.phraseModel.deleteMany({ topicId: topicObjectId });
    await this.topicModel.findByIdAndDelete(topicId);

    return {
      message: `Тема "${topic.title}" та всі її фрази успішно видалені`,
    };
  }

  async createPhrase(createPhraseDto: CreatePhraseDto): Promise<PhraseResponse> {
    const { topicId, ...phraseData } = createPhraseDto;

    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const phrase = await this.phraseModel.create({
      ...phraseData,
      topicId: new Types.ObjectId(topicId),
    });

    return {
      id: String(phrase._id),
      phrase: phrase.phrase,
      translation: phrase.translation,
      audioUrl: phrase.audioUrl,
      topicId: topicId,
      isKnown: false,
    };
  }

  async updatePhrase(phraseId: string, updatePhraseDto: UpdatePhraseDto): Promise<PhraseResponse> {
    if (!Types.ObjectId.isValid(phraseId)) {
      throw new NotFoundException(`Невірний ID фрази`);
    }

    const updateData: PhraseUpdateData = {};

    if (updatePhraseDto.phrase !== undefined) {
      updateData.phrase = updatePhraseDto.phrase;
    }
    if (updatePhraseDto.translation !== undefined) {
      updateData.translation = updatePhraseDto.translation;
    }
    if (updatePhraseDto.audioUrl !== undefined) {
      updateData.audioUrl = updatePhraseDto.audioUrl;
    }

    if (updatePhraseDto.topicId) {
      if (!Types.ObjectId.isValid(updatePhraseDto.topicId)) {
        throw new NotFoundException(`Невірний ID теми`);
      }

      const topic = await this.topicModel.findById(updatePhraseDto.topicId);
      if (!topic) {
        throw new NotFoundException(`Тема з ID ${updatePhraseDto.topicId} не знайдена`);
      }

      updateData.topicId = updatePhraseDto.topicId;
    }

    const phrase = await this.phraseModel.findByIdAndUpdate(phraseId, updateData, { new: true });

    if (!phrase) {
      throw new NotFoundException(`Фраза з ID ${phraseId} не знайдено`);
    }

    return {
      id: String(phrase._id),
      phrase: phrase.phrase,
      translation: phrase.translation,
      audioUrl: phrase.audioUrl,
      topicId: phrase.topicId.toString(),
      isKnown: false,
    };
  }

  async deletePhrase(phraseId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(phraseId)) {
      throw new NotFoundException(`Невірний ID слова`);
    }

    const phrase = await this.phraseModel.findById(phraseId);

    if (!phrase) {
      throw new NotFoundException(`Фраза з ID ${phraseId} не знайдено`);
    }

    const wordObjectId = new Types.ObjectId(phraseId);
    await this.userPhraseModel.deleteMany({ phraseId: wordObjectId });
    await this.phraseModel.findByIdAndDelete(phraseId);

    return {
      message: `Фраза "${phrase.phrase}" успішно видалена`,
    };
  }

  async getAllTopicsAdmin(): Promise<TopicResponse[]> {
    const topics = await this.topicModel.find().lean<TopicLean[]>();
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic): Promise<TopicResponse> => {
        const totalItems = await this.phraseModel.countDocuments({
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

  async getAllPhrasesAdmin(topicId: string): Promise<PhraseResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const phrases = await this.phraseModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<PhraseLean[]>();

    return phrases.map(
      (phrase): PhraseResponse => ({
        id: String(phrase._id),
        phrase: phrase.phrase,
        translation: phrase.translation,
        audioUrl: phrase.audioUrl,
        topicId: topicId,
        isKnown: false,
      }),
    );
  }
}
