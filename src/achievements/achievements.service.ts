import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Achievement } from './schemas/achievement.schema';
import { UserAchievement } from './schemas/user-achievement.schema';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import {
  AchievementLean,
  UserAchievementLean,
  AchievementResponse,
  UserStatsResponse,
  UnlockAchievementResponse,
} from './interfaces/achievements.interface';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel(Achievement.name)
    private achievementModel: Model<Achievement>,
    @InjectModel(UserAchievement.name)
    private userAchievementModel: Model<UserAchievement>,
    @InjectModel('UserWord')
    private userWordModel: Model<any>,
    @InjectModel('UserPhrase')
    private userPhraseModel: Model<any>,
    @InjectModel('UserExercise')
    private userExerciseModel: Model<any>,
    @InjectModel('UserGrammarTest')
    private userGrammarTestModel: Model<any>,
    @InjectModel('User')
    private userModel: Model<any>,
  ) {}

  async getUserAchievements(userId: string): Promise<AchievementResponse[]> {
    const achievements = await this.achievementModel
      .find({ isActive: true })
      .lean<AchievementLean[]>();

    const userAchievements = await this.userAchievementModel
      .find({ userId: new Types.ObjectId(userId) })
      .lean<UserAchievementLean[]>();

    const userAchievementsMap = new Map<string, UserAchievementLean>(
      userAchievements.map((ua) => [String(ua.achievementId), ua]),
    );

    const stats = await this.calculateUserStats(userId);

    return achievements.map((achievement): AchievementResponse => {
      const userAchievement = userAchievementsMap.get(String(achievement._id));

      let currentProgress = 0;
      switch (achievement.category) {
        case 'words':
          currentProgress = stats.knownWords;
          break;
        case 'phrases':
          currentProgress = stats.knownPhrases;
          break;
        case 'exercises':
          currentProgress = stats.completedExercises;
          break;
        case 'grammar':
          currentProgress = stats.completedGrammarTests;
          break;
        case 'points':
          currentProgress = stats.totalPoints;
          break;
        case 'streak':
          currentProgress = stats.streak;
          break;
      }

      return {
        id: String(achievement._id),
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        category: achievement.category,
        target: achievement.target,
        points: achievement.points,
        progress: currentProgress,
        isUnlocked: userAchievement?.isUnlocked || false,
        unlockedAt: userAchievement?.unlockedAt?.toISOString(),
      };
    });
  }

  async calculateUserStats(userId: string): Promise<UserStatsResponse> {
    const userObjectId = new Types.ObjectId(userId);

    const [
      knownWords,
      totalWords,
      knownPhrases,
      totalPhrases,
      completedExercises,
      totalExercises,
      completedGrammarTests,
      totalGrammarTests,
      unlockedAchievements,
      totalAchievements,
    ] = await Promise.all([
      this.userWordModel.countDocuments({
        userId: userObjectId,
        isKnown: true,
      }),
      this.userWordModel.countDocuments({ userId: userObjectId }),
      this.userPhraseModel.countDocuments({
        userId: userObjectId,
        isKnown: true,
      }),
      this.userPhraseModel.countDocuments({ userId: userObjectId }),
      this.userExerciseModel.countDocuments({
        userId: userObjectId,
        isCompleted: true,
      }),
      this.userExerciseModel.countDocuments({ userId: userObjectId }),
      this.userGrammarTestModel.countDocuments({
        userId: userObjectId,
        passed: true,
      }),
      this.userGrammarTestModel.countDocuments({ userId: userObjectId }),
      this.userAchievementModel.countDocuments({
        userId: userObjectId,
        isUnlocked: true,
      }),
      this.achievementModel.countDocuments({ isActive: true }),
    ]);

    const user = await this.userModel.findById(userId).lean<{ points?: number; streak?: number }>();

    return {
      knownWords,
      totalWords,
      knownPhrases,
      totalPhrases,
      completedExercises,
      totalExercises,
      completedGrammarTests,
      totalGrammarTests,
      totalPoints: user?.points || 0,
      streak: user?.streak || 0,
      unlockedAchievements,
      totalAchievements,
    };
  }

  async checkAndUnlockAchievements(userId: string): Promise<UnlockAchievementResponse> {
    const stats = await this.calculateUserStats(userId);
    const achievements = await this.achievementModel
      .find({ isActive: true })
      .lean<AchievementLean[]>();

    const newlyUnlocked: AchievementResponse[] = [];

    for (const achievement of achievements) {
      let currentProgress = 0;

      switch (achievement.category) {
        case 'words':
          currentProgress = stats.knownWords;
          break;
        case 'phrases':
          currentProgress = stats.knownPhrases;
          break;
        case 'exercises':
          currentProgress = stats.completedExercises;
          break;
        case 'grammar':
          currentProgress = stats.completedGrammarTests;
          break;
        case 'points':
          currentProgress = stats.totalPoints;
          break;
        case 'streak':
          currentProgress = stats.streak;
          break;
      }

      if (currentProgress >= achievement.target) {
        const userAchievement = await this.userAchievementModel.findOne({
          userId: new Types.ObjectId(userId),
          achievementId: achievement._id,
        });

        if (!userAchievement) {
          const newUserAchievement = await this.userAchievementModel.create({
            userId: new Types.ObjectId(userId),
            achievementId: achievement._id,
            progress: currentProgress,
            isUnlocked: true,
            unlockedAt: new Date(),
          });

          await this.userModel.findByIdAndUpdate(userId, {
            $inc: { points: achievement.points },
          });

          newlyUnlocked.push({
            id: String(achievement._id),
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            type: achievement.type,
            category: achievement.category,
            target: achievement.target,
            points: achievement.points,
            progress: currentProgress,
            isUnlocked: true,
            unlockedAt: newUserAchievement.unlockedAt.toISOString(),
          });
        } else if (!userAchievement.isUnlocked) {
          userAchievement.isUnlocked = true;
          userAchievement.progress = currentProgress;
          userAchievement.unlockedAt = new Date();
          await userAchievement.save();

          await this.userModel.findByIdAndUpdate(userId, {
            $inc: { points: achievement.points },
          });

          newlyUnlocked.push({
            id: String(achievement._id),
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            type: achievement.type,
            category: achievement.category,
            target: achievement.target,
            points: achievement.points,
            progress: currentProgress,
            isUnlocked: true,
            unlockedAt: userAchievement.unlockedAt.toISOString(),
          });
        } else {
          userAchievement.progress = currentProgress;
          await userAchievement.save();
        }
      } else {
        await this.userAchievementModel.findOneAndUpdate(
          {
            userId: new Types.ObjectId(userId),
            achievementId: achievement._id,
          },
          {
            progress: currentProgress,
          },
          { upsert: true },
        );
      }
    }

    return {
      success: true,
      newlyUnlocked,
      message:
        newlyUnlocked.length > 0
          ? `Розблоковано ${newlyUnlocked.length} нових досягнень!`
          : 'Немає нових досягнень',
    };
  }

  async getAllAchievements(): Promise<AchievementResponse[]> {
    const achievements = await this.achievementModel.find().lean<AchievementLean[]>();

    return achievements.map(
      (achievement): AchievementResponse => ({
        id: String(achievement._id),
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        category: achievement.category,
        target: achievement.target,
        points: achievement.points,
        progress: 0,
        isUnlocked: false,
      }),
    );
  }

  async createAchievement(
    createAchievementDto: CreateAchievementDto,
  ): Promise<AchievementResponse> {
    const achievement = await this.achievementModel.create(createAchievementDto);

    return {
      id: String(achievement._id),
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      category: achievement.category,
      target: achievement.target,
      points: achievement.points,
      progress: 0,
      isUnlocked: false,
    };
  }

  async updateAchievement(
    achievementId: string,
    updateAchievementDto: UpdateAchievementDto,
  ): Promise<AchievementResponse> {
    if (!Types.ObjectId.isValid(achievementId)) {
      throw new NotFoundException(`Невірний ID досягнення`);
    }

    const achievement = await this.achievementModel.findByIdAndUpdate(
      achievementId,
      updateAchievementDto,
      { new: true },
    );

    if (!achievement) {
      throw new NotFoundException(`Досягнення з ID ${achievementId} не знайдено`);
    }

    return {
      id: String(achievement._id),
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      category: achievement.category,
      target: achievement.target,
      points: achievement.points,
      progress: 0,
      isUnlocked: false,
    };
  }

  async deleteAchievement(achievementId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(achievementId)) {
      throw new NotFoundException(`Невірний ID досягнення`);
    }

    const achievement = await this.achievementModel.findById(achievementId);

    if (!achievement) {
      throw new NotFoundException(`Досягнення з ID ${achievementId} не знайдено`);
    }

    await this.userAchievementModel.deleteMany({
      achievementId: new Types.ObjectId(achievementId),
    });
    await this.achievementModel.findByIdAndDelete(achievementId);

    return {
      message: `Досягнення "${achievement.title}" успішно видалено`,
    };
  }
}
