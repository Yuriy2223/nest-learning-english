import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { UsersModule } from '../user/user.module';
import { UserWord, UserWordSchema } from '../vocabulary/schemas/user-word.schema';
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
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
