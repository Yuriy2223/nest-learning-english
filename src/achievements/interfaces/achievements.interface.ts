export interface AchievementLean {
  _id: string;
  title: string;
  description: string;
  icon: string;
  type: 'bronze' | 'silver' | 'gold' | 'diamond';
  category: 'words' | 'phrases' | 'exercises' | 'grammar' | 'streak' | 'points';
  target: number;
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievementLean {
  _id: string;
  userId: string;
  achievementId: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementResponse {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'bronze' | 'silver' | 'gold' | 'diamond';
  category: 'words' | 'phrases' | 'exercises' | 'grammar' | 'streak' | 'points';
  target: number;
  points: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface UserStatsResponse {
  knownWords: number;
  totalWords: number;
  knownPhrases: number;
  totalPhrases: number;
  completedExercises: number;
  totalExercises: number;
  completedGrammarTests: number;
  totalGrammarTests: number;
  totalPoints: number;
  streak: number;
  unlockedAchievements: number;
  totalAchievements: number;
}

export interface UnlockAchievementResponse {
  success: boolean;
  newlyUnlocked: AchievementResponse[];
  message: string;
}
