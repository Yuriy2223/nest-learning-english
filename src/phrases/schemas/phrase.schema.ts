import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'phrases_phrases', timestamps: true })
export class Phrase extends Document {
  @Prop({ required: true })
  phrase: string;

  @Prop({ required: true })
  translation: string;

  @Prop()
  audioUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;
}

export const PhraseSchema = SchemaFactory.createForClass(Phrase);
