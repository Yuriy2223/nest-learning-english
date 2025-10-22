import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

@Schema({ collection: 'exercises_topics', timestamps: true })
export class TopicExercise extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  imageUrl: string;

  @Prop({
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  })
  difficulty: ExerciseDifficulty;

  @Prop({ default: 0 })
  totalScore: number;
}

export const TopicExerciseSchema = SchemaFactory.createForClass(TopicExercise);
