import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GrammarController } from './grammar.controller';
import { GrammarService } from './grammar.service';
import { GrammarTopic, GrammarTopicSchema } from './schemas/grammar-topic.schema';
import { GrammarRule, GrammarRuleSchema } from './schemas/grammar-rule.schema';
import { UserGrammarRule, UserGrammarRuleSchema } from './schemas/user-grammar-rules.schema';
import { GrammarQuestion, GrammarQuestionSchema } from './schemas/grammar-question.schema';
import { UserGrammarTest, UserGrammarTestSchema } from './schemas/user-grammar-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GrammarTopic.name, schema: GrammarTopicSchema },
      { name: GrammarRule.name, schema: GrammarRuleSchema },
      { name: UserGrammarRule.name, schema: UserGrammarRuleSchema },
      { name: GrammarQuestion.name, schema: GrammarQuestionSchema },
      { name: UserGrammarTest.name, schema: UserGrammarTestSchema },
    ]),
  ],
  controllers: [GrammarController],
  providers: [GrammarService],
  exports: [GrammarService],
})
export class GrammarModule {}
