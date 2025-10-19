import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'user_grammar_rules', timestamps: true })
export class UserGrammarRule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GrammarRule', required: true })
  ruleId: Types.ObjectId;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserGrammarRuleSchema = SchemaFactory.createForClass(UserGrammarRule);

UserGrammarRuleSchema.index({ userId: 1, ruleId: 1 }, { unique: true });
