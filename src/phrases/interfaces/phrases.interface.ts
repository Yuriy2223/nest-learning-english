export interface TopicLean {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface PhraseLean {
  _id: string;
  phrase: string;
  translation: string;
  audioUrl?: string;
  topicId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPhraseLean {
  _id: string;
  userId: string;
  phraseId: string;
  isKnown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhraseUpdateData {
  phrase?: string;
  translation?: string;
  audioUrl?: string;
  topicId?: string;
}

export interface PhraseResponse {
  id: string;
  phrase: string;
  translation: string;
  audioUrl?: string;
  topicId: string;
  isKnown: boolean;
}

export interface PhraseStatusResponse {
  phraseId: string;
  isKnown: boolean;
  message: string;
}
export interface TopicResponse {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  totalItems: number;
  completedItems: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
