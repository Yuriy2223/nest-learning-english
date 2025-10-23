import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { User, UserSchema } from '../user/schemas/user.schema';
import { UserWord, UserWordSchema } from 'src/vocabulary/schemas/user-word.schema';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { UserAchievement, UserAchievementSchema } from './schemas/user-achievement.schema';
import { UserPhrase, UserPhraseSchema } from '../phrases/schemas/user-phrases.schema';
import { UserExercise, UserExerciseSchema } from '../exercises/schemas/user-exercise.schema';
import {
  UserGrammarTest,
  UserGrammarTestSchema,
} from '../grammar/schemas/user-grammar-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: UserWord.name, schema: UserWordSchema },
      { name: UserPhrase.name, schema: UserPhraseSchema },
      { name: UserExercise.name, schema: UserExerciseSchema },
      { name: UserGrammarTest.name, schema: UserGrammarTestSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
