import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'user_phrases', timestamps: true })
export class UserPhrase extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'phrases', required: true })
  phraseId: Types.ObjectId;

  @Prop({ default: false })
  isKnown: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserPhraseSchema = SchemaFactory.createForClass(UserPhrase);

UserPhraseSchema.index({ userId: 1, phraseId: 1 }, { unique: true });
