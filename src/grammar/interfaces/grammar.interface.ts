export interface GrammarTopicLean {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface GrammarRuleLean {
  _id: string;
  title: string;
  description: string;
  examples: string[];
  topicId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserGrammarRuleLean {
  _id: string;
  userId: string;
  ruleId: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrammarRuleUpdateData {
  title?: string;
  description?: string;
  examples?: string[];
  topicId?: string;
}

export interface GrammarRuleResponse {
  id: string;
  title: string;
  description: string;
  examples: string[];
  topicId: string;
  isCompleted?: boolean;
}

export interface GrammarRuleStatusResponse {
  ruleId: string;
  isCompleted: boolean;
  message: string;
}

export interface GrammarTopicResponse {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  totalItems: number;
  completedItems: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GrammarQuestionLean {
  _id: string;
  topicId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrammarQuestionResponse {
  id: string;
  question: string;
  options: string[];
}

export interface GrammarTestResultResponse {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  correctAnswers: {
    questionId: string;
    correctAnswer: number;
    userAnswer: number;
    isCorrect: boolean;
    explanation?: string;
  }[];
}
