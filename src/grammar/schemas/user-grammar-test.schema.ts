import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'user_grammar_tests', timestamps: true })
export class UserGrammarTest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GrammarTopic', required: true })
  topicId: Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  totalQuestions: number;

  @Prop({ required: true })
  percentage: number;

  @Prop({ default: false })
  passed: boolean;

  @Prop()
  completedAt: Date;
}

export const UserGrammarTestSchema = SchemaFactory.createForClass(UserGrammarTest);

UserGrammarTestSchema.index({ userId: 1, topicId: 1 });
