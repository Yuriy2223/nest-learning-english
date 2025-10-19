import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'grammar_questions', timestamps: true })
export class GrammarQuestion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'GrammarTopic', required: true })
  topicId: Types.ObjectId;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true, min: 0, max: 3 })
  correctAnswer: number;

  @Prop()
  explanation?: string;
}

export const GrammarQuestionSchema = SchemaFactory.createForClass(GrammarQuestion);
