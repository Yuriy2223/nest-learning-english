import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Topic } from './schemas/topic.schema';
import { Word } from './schemas/word.schema';
import { UserWord } from './schemas/user-word.schema';
import {
  TopicLean,
  WordLean,
  UserWordLean,
  WordUpdateData,
  TopicResponse,
  WordResponse,
  WordStatusResponse,
} from './interfaces/vocabulary.interface';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

@Injectable()
export class VocabularyService {
  constructor(
    @InjectModel(Topic.name)
    private topicModel: Model<Topic>,
    @InjectModel(Word.name)
    private wordModel: Model<Word>,
    @InjectModel(UserWord.name)
    private userWordModel: Model<UserWord>,
  ) {}

  async getTopics(userId: string): Promise<TopicResponse[]> {
    const topics = await this.topicModel
      .find()
      .select('title description imageUrl difficulty type')
      .lean<TopicLean[]>();

    const topicsWithProgress = await Promise.all(
      topics.map(async (topic): Promise<TopicResponse> => {
        const totalItems = await this.wordModel.countDocuments({
          topicId: new Types.ObjectId(topic._id),
        });

        const wordIds = await this.wordModel
          .find({ topicId: new Types.ObjectId(topic._id) })
          .distinct('_id');

        const completedItems = await this.userWordModel.countDocuments({
          userId: new Types.ObjectId(userId),
          wordId: { $in: wordIds },
          isKnown: true,
        });

        return {
          id: topic._id,
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

  async getTopicWords(topicId: string, userId: string): Promise<WordResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicModel.findById(topicId);

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const words = await this.wordModel
      .find({ topicId: new Types.ObjectId(topicId) })
      // .select('word translation transcription audioUrl')
      .lean<WordLean[]>();

    const wordIds = words.map((w) => new Types.ObjectId(w._id));

    const userWords = await this.userWordModel
      .find({
        userId: new Types.ObjectId(userId),
        wordId: { $in: wordIds },
      })
      .lean<UserWordLean[]>();

    const userWordsMap = new Map<string, boolean>(userWords.map((uw) => [uw.wordId, uw.isKnown]));

    return words.map(
      (word): WordResponse => ({
        id: word._id,
        word: word.word,
        translation: word.translation,
        transcription: word.transcription,
        audioUrl: word.audioUrl,
        topicId: topicId,
        isKnown: userWordsMap.get(word._id) || false,
      }),
    );
  }

  async updateWordStatus(
    wordId: string,
    userId: string,
    isKnown: boolean,
  ): Promise<WordStatusResponse> {
    if (!Types.ObjectId.isValid(wordId)) {
      throw new NotFoundException(`Невірний ID слова`);
    }

    const word = await this.wordModel.findById(wordId);

    if (!word) {
      throw new NotFoundException(`Слово з ID ${wordId} не знайдено`);
    }

    const userWord = await this.userWordModel.findOne({
      userId: new Types.ObjectId(userId),
      wordId: new Types.ObjectId(wordId),
    });

    if (userWord) {
      userWord.isKnown = isKnown;
      userWord.updatedAt = new Date();
      await userWord.save();
    } else {
      await this.userWordModel.create({
        userId: new Types.ObjectId(userId),
        wordId: new Types.ObjectId(wordId),
        isKnown,
      });
    }

    return {
      wordId,
      isKnown,
      message: 'Статус слова оновлено успішно',
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

    const totalItems = await this.wordModel.countDocuments({
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
    const wordIds = await this.wordModel.find({ topicId: topicObjectId }).distinct('_id');

    if (wordIds.length > 0) {
      await this.userWordModel.deleteMany({ wordId: { $in: wordIds } });
    }

    await this.wordModel.deleteMany({ topicId: topicObjectId });
    await this.topicModel.findByIdAndDelete(topicId);

    return {
      message: `Тема "${topic.title}" та всі її слова успішно видалені`,
    };
  }

  async createWord(createWordDto: CreateWordDto): Promise<WordResponse> {
    const { topicId, ...wordData } = createWordDto;

    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const word = await this.wordModel.create({
      ...wordData,
      topicId: new Types.ObjectId(topicId),
    });

    return {
      id: String(word._id),
      word: word.word,
      translation: word.translation,
      transcription: word.transcription,
      audioUrl: word.audioUrl,
      topicId: topicId,
      isKnown: false,
    };
  }

  async updateWord(wordId: string, updateWordDto: UpdateWordDto): Promise<WordResponse> {
    if (!Types.ObjectId.isValid(wordId)) {
      throw new NotFoundException(`Невірний ID слова`);
    }

    const updateData: WordUpdateData = {};

    if (updateWordDto.word !== undefined) {
      updateData.word = updateWordDto.word;
    }
    if (updateWordDto.translation !== undefined) {
      updateData.translation = updateWordDto.translation;
    }
    if (updateWordDto.transcription !== undefined) {
      updateData.transcription = updateWordDto.transcription;
    }
    if (updateWordDto.audioUrl !== undefined) {
      updateData.audioUrl = updateWordDto.audioUrl;
    }

    if (updateWordDto.topicId) {
      if (!Types.ObjectId.isValid(updateWordDto.topicId)) {
        throw new NotFoundException(`Невірний ID теми`);
      }

      const topic = await this.topicModel.findById(updateWordDto.topicId);
      if (!topic) {
        throw new NotFoundException(`Тема з ID ${updateWordDto.topicId} не знайдена`);
      }

      updateData.topicId = updateWordDto.topicId;
    }

    const word = await this.wordModel.findByIdAndUpdate(wordId, updateData, { new: true });

    if (!word) {
      throw new NotFoundException(`Слово з ID ${wordId} не знайдено`);
    }

    return {
      id: String(word._id),
      word: word.word,
      translation: word.translation,
      transcription: word.transcription,
      audioUrl: word.audioUrl,
      topicId: word.topicId.toString(),
      isKnown: false,
    };
  }

  async deleteWord(wordId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(wordId)) {
      throw new NotFoundException(`Невірний ID слова`);
    }

    const word = await this.wordModel.findById(wordId);

    if (!word) {
      throw new NotFoundException(`Слово з ID ${wordId} не знайдено`);
    }

    const wordObjectId = new Types.ObjectId(wordId);
    await this.userWordModel.deleteMany({ wordId: wordObjectId });
    await this.wordModel.findByIdAndDelete(wordId);

    return {
      message: `Слово "${word.word}" успішно видалено`,
    };
  }

  async getAllTopicsAdmin(): Promise<TopicResponse[]> {
    const topics = await this.topicModel.find().lean<TopicLean[]>();
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic): Promise<TopicResponse> => {
        const totalItems = await this.wordModel.countDocuments({
          topicId: new Types.ObjectId(topic._id),
        });

        return {
          id: topic._id,
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

  async getAllWordsAdmin(topicId: string): Promise<WordResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const words = await this.wordModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<WordLean[]>();

    return words.map(
      (word): WordResponse => ({
        id: word._id,
        word: word.word,
        translation: word.translation,
        transcription: word.transcription,
        audioUrl: word.audioUrl,
        topicId: topicId,
        isKnown: false,
      }),
    );
  }
}
