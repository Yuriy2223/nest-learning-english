export interface TopicLean {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  type: 'vocabulary' | 'phrases' | 'grammar';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface WordLean {
  _id: string;
  word: string;
  translation: string;
  transcription: string;
  audioUrl?: string;
  topicId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWordLean {
  _id: string;
  userId: string;
  wordId: string;
  isKnown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordUpdateData {
  word?: string;
  translation?: string;
  transcription?: string;
  audioUrl?: string;
  topicId?: string;
}

export interface WordResponse {
  id: string;
  word: string;
  translation: string;
  transcription: string;
  audioUrl?: string;
  topicId: string;
  isKnown: boolean;
}

export interface WordStatusResponse {
  wordId: string;
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
  type: 'vocabulary' | 'phrases' | 'grammar';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
