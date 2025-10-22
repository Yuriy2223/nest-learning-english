import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExerciseType = 'multiple_choice' | 'fill_blank' | 'translation';

@Schema({ collection: 'exercises_exercises', timestamps: true })
export class Exercise extends Document {
  @Prop({
    type: String,
    enum: ['multiple_choice', 'fill_blank', 'translation'],
    required: true,
  })
  type: ExerciseType;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ required: true, default: 10 })
  points: number;

  @Prop({ type: Types.ObjectId, ref: 'TopicExercise', required: true })
  topicId: Types.ObjectId;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
