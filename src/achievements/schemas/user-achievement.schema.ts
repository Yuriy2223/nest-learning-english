import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'user_achievements', timestamps: true })
export class UserAchievement extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Achievement', required: true })
  achievementId: Types.ObjectId;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: false })
  isUnlocked: boolean;

  @Prop()
  unlockedAt: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserAchievementSchema = SchemaFactory.createForClass(UserAchievement);

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
