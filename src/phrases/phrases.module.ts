import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhrasesController } from './phrases.controller';
import { TopicPhrase, TopicPhraseSchema } from './schemas/topic.schema';
import { PhrasesService } from './phrases.service';
import { UserPhrase, UserPhraseSchema } from './schemas/user-phrases.schema';
import { Phrase, PhraseSchema } from './schemas/phrase.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TopicPhrase.name, schema: TopicPhraseSchema },
      { name: Phrase.name, schema: PhraseSchema },
      { name: UserPhrase.name, schema: UserPhraseSchema },
    ]),
  ],
  controllers: [PhrasesController],
  providers: [PhrasesService],
  exports: [PhrasesService],
})
export class PhrasesModule {}
