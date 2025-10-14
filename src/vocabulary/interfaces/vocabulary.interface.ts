// import { Types } from 'mongoose';

// export interface TopicLean {
//   _id: Types.ObjectId;
//   title: string;
//   description: string;
//   imageUrl?: string;
//   type: 'vocabulary' | 'phrases' | 'grammar';
//   difficulty: 'beginner' | 'intermediate' | 'advanced';
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface WordLean {
//   _id: Types.ObjectId;
//   word: string;
//   translation: string;
//   transcription: string;
//   audioUrl?: string;
//   topicId: Types.ObjectId;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface UserWordLean {
//   _id: Types.ObjectId;
//   userId: Types.ObjectId;
//   wordId: Types.ObjectId;
//   isKnown: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface WordUpdateData {
//   word?: string;
//   translation?: string;
//   transcription?: string;
//   audioUrl?: string;
//   topicId?: Types.ObjectId;
// }

// export interface WordResponse {
//   id: string;
//   word: string;
//   translation: string;
//   transcription: string;
//   audioUrl?: string;
//   topicId: string;
//   isKnown: boolean;
// }

// export interface WordStatusResponse {
//   wordId: string;
//   isKnown: boolean;
//   message: string;
// }
// export interface TopicResponse {
//   id: string;
//   title: string;
//   description: string;
//   imageUrl: string | null;
//   totalItems: number;
//   completedItems: number;
//   type: 'vocabulary' | 'phrases' | 'grammar';
//   difficulty: 'beginner' | 'intermediate' | 'advanced';
// }
/*************************************************** */

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
  imageUrl: string | null;
  totalItems: number;
  completedItems: number;
  type: 'vocabulary' | 'phrases' | 'grammar';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
