import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'user_vocabulary_words', timestamps: true })
export class UserWord extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'vocabulary_words', required: true })
  wordId: Types.ObjectId;

  @Prop({ default: false })
  isKnown: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserWordSchema = SchemaFactory.createForClass(UserWord);

UserWordSchema.index({ userId: 1, wordId: 1 }, { unique: true });
