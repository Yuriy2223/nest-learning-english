import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { TopicExercise, TopicExerciseSchema } from './schemas/topic-exercise.schema';
import { Exercise, ExerciseSchema } from './schemas/exercise.schema';
import { UserExercise, UserExerciseSchema } from './schemas/user-exercise.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TopicExercise.name, schema: TopicExerciseSchema },
      { name: Exercise.name, schema: ExerciseSchema },
      { name: UserExercise.name, schema: UserExerciseSchema },
    ]),
  ],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
