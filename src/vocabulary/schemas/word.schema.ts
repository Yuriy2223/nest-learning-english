import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Word extends Document {
  @Prop({ required: true })
  word: string;

  @Prop({ required: true })
  translation: string;

  @Prop({ required: true })
  transcription: string;

  @Prop()
  audioUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;
}

export const WordSchema = SchemaFactory.createForClass(Word);
