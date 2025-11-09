import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  name?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: 0 })
  totalStudySeconds: number;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  streak: number;

  @Prop()
  lastStreakDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
