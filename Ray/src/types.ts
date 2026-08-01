export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  bucketId?: string;
  date: string;
  description: string;
};

export type BucketType = 'monthly' | 'goal';

export type Bucket = {
  id: string;
  name: string;
  type: BucketType;
  targetAmount?: number;
  assignedAmount: number;
};

export type LoanDirection = 'given' | 'received';

export type Loan = {
  id: string;
  personName: string;
  direction: LoanDirection;
  principalAmount: number;
  outstandingBalance: number;
  fundingBucketId?: string;
  date: string;
};

export type Repayment = {
  id: string;
  loanId: string;
  amount: number;
  date: string;
};

export type FoodLog = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  date: string;
};

export type Workout = {
  id: string;
  exercise: string;
  reps?: number;
  durationMins?: number;
  caloriesBurned: number;
  date: string;
};

export type Note = {
  id: string;
  content: string;
  date: string;
  pinned?: boolean;
};

export type WorkoutPlanExercise = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  completed: boolean;
};

export type WorkoutPlanDay = {
  id: string;
  dayName: string;
  exercises: WorkoutPlanExercise[];
};

export type WorkoutPlan = {
  id: string;
  goal: string;
  experience: string;
  types: string[];
  equipment: string[];
  days: WorkoutPlanDay[];
};

export type WeightLog = {
  id: string;
  date: string;
  weight: number;
};

export type SleepLog = {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
};

export type WaterLog = {
  id: string;
  date: string;
  amount: number; // in ml
};

export type UserProfile = {
  height: number | null; // in cm
  targetWeight: number | null; // in kg
  age: number | null;
  gender: 'male' | 'female' | null;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  dailyWaterGoal?: number; // in ml
};

export type ViewType = 'dashboard' | 'budget' | 'diet' | 'fitness' | 'notes' | 'settings';


export type FavoriteMeal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
