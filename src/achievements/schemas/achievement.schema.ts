import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AchievementType = 'bronze' | 'silver' | 'gold' | 'diamond';
export type AchievementCategory =
  | 'words'
  | 'phrases'
  | 'exercises'
  | 'grammar'
  | 'streak'
  | 'points';

@Schema({ collection: 'achievements', timestamps: true })
export class Achievement extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({
    type: String,
    enum: ['bronze', 'silver', 'gold', 'diamond'],
    required: true,
  })
  type: AchievementType;

  @Prop({
    type: String,
    enum: ['words', 'phrases', 'exercises', 'grammar', 'streak', 'points'],
    required: true,
  })
  category: AchievementCategory;

  @Prop({ required: true })
  target: number;

  @Prop({ required: true, default: 0 })
  points: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
