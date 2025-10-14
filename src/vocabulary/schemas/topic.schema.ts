import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TopicType = 'vocabulary' | 'phrases' | 'grammar';
export type TopicDifficulty = 'beginner' | 'intermediate' | 'advanced';

@Schema({ timestamps: true })
export class Topic extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  imageUrl: string;

  @Prop({
    type: String,
    enum: ['vocabulary', 'phrases', 'grammar'],
    required: true,
  })
  type: TopicType;

  @Prop({
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  })
  difficulty: TopicDifficulty;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
