import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'user_exercises', timestamps: true })
export class UserExercise extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true })
  exerciseId: Types.ObjectId;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: 0 })
  earnedPoints: number;

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserExerciseSchema = SchemaFactory.createForClass(UserExercise);

UserExerciseSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });
