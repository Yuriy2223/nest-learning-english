import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TopicExercise } from './schemas/topic-exercise.schema';
import { Exercise } from './schemas/exercise.schema';
import { UserExercise } from './schemas/user-exercise.schema';
import { CreateTopicExerciseDto } from './dto/create-topic-exercise.dto';
import { UpdateTopicExerciseDto } from './dto/update-topic-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import {
  TopicExerciseLean,
  ExerciseLean,
  UserExerciseLean,
  TopicExerciseResponse,
  ExerciseResponse,
  ExerciseSubmitResponse,
  ExerciseUpdateData,
} from './interfaces/exercises.interface';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectModel(TopicExercise.name)
    private topicExerciseModel: Model<TopicExercise>,
    @InjectModel(Exercise.name)
    private exerciseModel: Model<Exercise>,
    @InjectModel(UserExercise.name)
    private userExerciseModel: Model<UserExercise>,
  ) {}

  async getTopics(userId: string): Promise<TopicExerciseResponse[]> {
    const topics = await this.topicExerciseModel.find().lean<TopicExerciseLean[]>();
    const topicsWithProgress = await Promise.all(
      topics.map(async (topic): Promise<TopicExerciseResponse> => {
        const exercises = await this.exerciseModel
          .find({ topicId: new Types.ObjectId(topic._id) })
          .lean<ExerciseLean[]>();

        const totalItems = exercises.length;
        const exerciseIds = exercises.map((e) => new Types.ObjectId(e._id));

        const completedItems = await this.userExerciseModel.countDocuments({
          userId: new Types.ObjectId(userId),
          exerciseId: { $in: exerciseIds },
          isCompleted: true,
        });

        const userExercises = await this.userExerciseModel
          .find({
            userId: new Types.ObjectId(userId),
            exerciseId: { $in: exerciseIds },
            isCompleted: true,
          })
          .lean<UserExerciseLean[]>();

        const earnedScore = userExercises.reduce((sum, ue) => sum + ue.earnedPoints, 0);

        const totalScore = exercises.reduce((sum, e) => sum + e.points, 0);

        return {
          id: String(topic._id),
          title: topic.title,
          description: topic.description,
          imageUrl: topic.imageUrl,
          totalItems,
          completedItems,
          difficulty: topic.difficulty,
          totalScore,
          earnedScore,
        };
      }),
    );

    return topicsWithProgress;
  }

  async getTopicExercises(topicId: string): Promise<ExerciseResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicExerciseModel.findById(topicId);

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const exercises = await this.exerciseModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<ExerciseLean[]>();

    return exercises.map(
      (exercise): ExerciseResponse => ({
        id: String(exercise._id),
        type: exercise.type,
        question: exercise.question,
        options: exercise.options,
        correctAnswer: exercise.correctAnswer,
        points: exercise.points,
        topicId: topicId,
      }),
    );
  }

  async submitExerciseAnswer(
    exerciseId: string,
    userId: string,
    answer: string,
    isCorrect: boolean,
    earnedPoints: number,
  ): Promise<ExerciseSubmitResponse> {
    if (!Types.ObjectId.isValid(exerciseId)) {
      throw new NotFoundException(`Невірний ID вправи`);
    }

    const exercise = await this.exerciseModel.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundException(`Вправа з ID ${exerciseId} не знайдена`);
    }

    const userExercise = await this.userExerciseModel.findOne({
      userId: new Types.ObjectId(userId),
      exerciseId: new Types.ObjectId(exerciseId),
    });

    if (userExercise) {
      userExercise.attempts += 1;

      if (isCorrect && !userExercise.isCompleted) {
        userExercise.isCompleted = true;
        userExercise.earnedPoints = earnedPoints;
      }

      userExercise.updatedAt = new Date();
      await userExercise.save();

      return {
        exerciseId,
        isCorrect,
        earnedPoints: userExercise.isCompleted ? userExercise.earnedPoints : 0,
        message: userExercise.isCompleted
          ? 'Вправа вже була виконана раніше'
          : isCorrect
            ? 'Відповідь правильна!'
            : 'Відповідь неправильна. Спробуйте ще раз.',
      };
    } else {
      await this.userExerciseModel.create({
        userId: new Types.ObjectId(userId),
        exerciseId: new Types.ObjectId(exerciseId),
        isCompleted: isCorrect,
        earnedPoints: isCorrect ? earnedPoints : 0,
        attempts: 1,
      });

      return {
        exerciseId,
        isCorrect,
        earnedPoints: isCorrect ? earnedPoints : 0,
        message: isCorrect ? 'Відповідь правильна!' : 'Відповідь неправильна. Спробуйте ще раз.',
      };
    }
  }

  async getAllTopicsAdmin(): Promise<TopicExerciseResponse[]> {
    const topics = await this.topicExerciseModel.find().lean<TopicExerciseLean[]>();
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic): Promise<TopicExerciseResponse> => {
        const exercises = await this.exerciseModel
          .find({ topicId: new Types.ObjectId(topic._id) })
          .lean<ExerciseLean[]>();

        const totalItems = exercises.length;
        const totalScore = exercises.reduce((sum, e) => sum + e.points, 0);

        return {
          id: String(topic._id),
          title: topic.title,
          description: topic.description,
          imageUrl: topic.imageUrl,
          totalItems,
          completedItems: 0,
          difficulty: topic.difficulty,
          totalScore,
          earnedScore: 0,
        };
      }),
    );

    return topicsWithCounts;
  }

  async createTopic(createTopicDto: CreateTopicExerciseDto): Promise<TopicExerciseResponse> {
    const topic = await this.topicExerciseModel.create(createTopicDto);

    return {
      id: String(topic._id),
      title: topic.title,
      description: topic.description,
      imageUrl: topic.imageUrl,
      totalItems: 0,
      completedItems: 0,
      difficulty: topic.difficulty,
      totalScore: 0,
      earnedScore: 0,
    };
  }

  async updateTopic(
    topicId: string,
    updateTopicDto: UpdateTopicExerciseDto,
  ): Promise<TopicExerciseResponse> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicExerciseModel.findByIdAndUpdate(topicId, updateTopicDto, {
      new: true,
    });

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const exercises = await this.exerciseModel.find({ topicId: topic._id }).lean<ExerciseLean[]>();

    const totalItems = exercises.length;
    const totalScore = exercises.reduce((sum, e) => sum + e.points, 0);

    return {
      id: String(topic._id),
      title: topic.title,
      description: topic.description,
      imageUrl: topic.imageUrl,
      totalItems,
      completedItems: 0,
      difficulty: topic.difficulty,
      totalScore,
      earnedScore: 0,
    };
  }

  async deleteTopic(topicId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicExerciseModel.findById(topicId);

    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const topicObjectId = new Types.ObjectId(topicId);
    const exerciseIds = await this.exerciseModel.find({ topicId: topicObjectId }).distinct('_id');

    if (exerciseIds.length > 0) {
      await this.userExerciseModel.deleteMany({ exerciseId: { $in: exerciseIds } });
    }

    await this.exerciseModel.deleteMany({ topicId: topicObjectId });
    await this.topicExerciseModel.findByIdAndDelete(topicId);

    return {
      message: `Тема "${topic.title}" та всі її вправи успішно видалені`,
    };
  }

  async getAllExercisesAdmin(topicId: string): Promise<ExerciseResponse[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicExerciseModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const exercises = await this.exerciseModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .lean<ExerciseLean[]>();

    return exercises.map(
      (exercise): ExerciseResponse => ({
        id: String(exercise._id),
        type: exercise.type,
        question: exercise.question,
        options: exercise.options,
        correctAnswer: exercise.correctAnswer,
        points: exercise.points,
        topicId: topicId,
      }),
    );
  }

  async createExercise(createExerciseDto: CreateExerciseDto): Promise<ExerciseResponse> {
    const { topicId, ...exerciseData } = createExerciseDto;

    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException(`Невірний ID теми`);
    }

    const topic = await this.topicExerciseModel.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Тема з ID ${topicId} не знайдена`);
    }

    const exercise = await this.exerciseModel.create({
      ...exerciseData,
      topicId: new Types.ObjectId(topicId),
    });

    return {
      id: String(exercise._id),
      type: exercise.type,
      question: exercise.question,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      points: exercise.points,
      topicId: topicId,
    };
  }

  async updateExercise(
    exerciseId: string,
    updateExerciseDto: UpdateExerciseDto,
  ): Promise<ExerciseResponse> {
    if (!Types.ObjectId.isValid(exerciseId)) {
      throw new NotFoundException(`Невірний ID вправи`);
    }

    const updateData: ExerciseUpdateData = {};

    if (updateExerciseDto.type !== undefined) {
      updateData.type = updateExerciseDto.type;
    }
    if (updateExerciseDto.question !== undefined) {
      updateData.question = updateExerciseDto.question;
    }
    if (updateExerciseDto.options !== undefined) {
      updateData.options = updateExerciseDto.options;
    }
    if (updateExerciseDto.correctAnswer !== undefined) {
      updateData.correctAnswer = updateExerciseDto.correctAnswer;
    }
    if (updateExerciseDto.points !== undefined) {
      updateData.points = updateExerciseDto.points;
    }

    if (updateExerciseDto.topicId) {
      if (!Types.ObjectId.isValid(updateExerciseDto.topicId)) {
        throw new NotFoundException(`Невірний ID теми`);
      }

      const topic = await this.topicExerciseModel.findById(updateExerciseDto.topicId);
      if (!topic) {
        throw new NotFoundException(`Тема з ID ${updateExerciseDto.topicId} не знайдена`);
      }

      updateData.topicId = updateExerciseDto.topicId;
    }

    const exercise = await this.exerciseModel.findByIdAndUpdate(exerciseId, updateData, {
      new: true,
    });

    if (!exercise) {
      throw new NotFoundException(`Вправа з ID ${exerciseId} не знайдена`);
    }

    return {
      id: String(exercise._id),
      type: exercise.type,
      question: exercise.question,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      points: exercise.points,
      topicId: exercise.topicId.toString(),
    };
  }

  async deleteExercise(exerciseId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(exerciseId)) {
      throw new NotFoundException(`Невірний ID вправи`);
    }

    const exercise = await this.exerciseModel.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundException(`Вправа з ID ${exerciseId} не знайдена`);
    }

    const exerciseObjectId = new Types.ObjectId(exerciseId);
    await this.userExerciseModel.deleteMany({ exerciseId: exerciseObjectId });
    await this.exerciseModel.findByIdAndDelete(exerciseId);

    return {
      message: `Вправа успішно видалена`,
    };
  }
}
