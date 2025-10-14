import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VocabularyController } from './vocabulary.controller';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { Word, WordSchema } from './schemas/word.schema';
import { UserWord, UserWordSchema } from './schemas/user-word.schema';
import { VocabularyService } from './vocabulary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: Word.name, schema: WordSchema },
      { name: UserWord.name, schema: UserWordSchema },
    ]),
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
