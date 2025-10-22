export interface TopicExerciseLean {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseLean {
  _id: string;
  type: 'multiple_choice' | 'fill_blank' | 'translation';
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  topicId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserExerciseLean {
  _id: string;
  userId: string;
  exerciseId: string;
  isCompleted: boolean;
  earnedPoints: number;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseUpdateData {
  type?: 'multiple_choice' | 'fill_blank' | 'translation';
  question?: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
  topicId?: string;
}

export interface ExerciseResponse {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'translation';
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  topicId: string;
}

export interface ExerciseSubmitResponse {
  exerciseId: string;
  isCorrect: boolean;
  earnedPoints: number;
  message: string;
}

export interface TopicExerciseResponse {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  totalItems: number;
  completedItems: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalScore: number;
  earnedScore: number;
}
