import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { BudgetView } from './views/BudgetView';
import { DietView } from './views/DietView';
import { FitnessView } from './views/FitnessView';
import { NotesView } from './views/NotesView';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Transaction, Bucket, Loan, Repayment, FoodLog, Workout, Note, ViewType, WorkoutPlan, WeightLog, UserProfile, SleepLog, WaterLog, FavoriteMeal } from './types';

import { SettingsView } from './views/SettingsView';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useEffect } from 'react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('lifehub_transactions', []);
  const [buckets, setBuckets] = useLocalStorage<Bucket[]>('lifehub_buckets', []);
  const [loans, setLoans] = useLocalStorage<Loan[]>('lifehub_loans', []);
  const [repayments, setRepayments] = useLocalStorage<Repayment[]>('lifehub_repayments', []);
  
  const [foods, setFoods] = useLocalStorage<FoodLog[]>('lifehub_foods', []);
  const [favoriteMeals, setFavoriteMeals] = useLocalStorage<FavoriteMeal[]>('lifehub_favorite_meals', []);
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('lifehub_workouts', []);
  const [notes, setNotes] = useLocalStorage<Note[]>('lifehub_notes', []);
  const [workoutPlan, setWorkoutPlan] = useLocalStorage<WorkoutPlan | null>('lifehub_workout_plan', null);
  const [weightLogs, setWeightLogs] = useLocalStorage<WeightLog[]>('lifehub_weights', []);
  const [sleepLogs, setSleepLogs] = useLocalStorage<SleepLog[]>('lifehub_sleeps', []);
  const [waterLogs, setWaterLogs] = useLocalStorage<WaterLog[]>('lifehub_waters', []);
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('lifehub_profile', { height: null, targetWeight: null, age: null, gender: null, activityLevel: null, dailyWaterGoal: 2000 });
  
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('lifehub_theme', 'dark');
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage<boolean>('lifehub_welcome_seen_v4', false);
  const [showWelcome, setShowWelcome] = useState(!hasSeenWelcome);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const replayWelcome = () => {
    setShowWelcome(true);
    setHasSeenWelcome(false);
  };

  if (showWelcome) {
    return <WelcomeScreen onComplete={() => {
      setShowWelcome(false);
      setHasSeenWelcome(true);
    }} />;
  }


  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView 
                  transactions={transactions} 
                  foods={foods} 
                  workouts={workouts} 
                  notes={notes} 
                  weightLogs={weightLogs}
                  userProfile={userProfile}
                  sleepLogs={sleepLogs}
                  waterLogs={waterLogs}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  onChangeView={setCurrentView} 
               />;
      case 'budget':
        return <BudgetView 
                  transactions={transactions} 
                  onUpdateTransactions={setTransactions} 
                  buckets={buckets}
                  onUpdateBuckets={setBuckets}
                  loans={loans}
                  onUpdateLoans={setLoans}
                  repayments={repayments}
                  onUpdateRepayments={setRepayments}
               />;
      case 'diet':
        return <DietView 
                  foods={foods} 
                  workouts={workouts} 
                  onUpdate={setFoods} 
                  waterLogs={waterLogs}
                  onUpdateWaterLogs={setWaterLogs}
                  userProfile={userProfile}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  favoriteMeals={favoriteMeals}
                  onUpdateFavoriteMeals={setFavoriteMeals}
               />;
      case 'fitness':
        return <FitnessView 
                  workouts={workouts} 
                  onUpdate={setWorkouts}
                  workoutPlan={workoutPlan}
                  onUpdateWorkoutPlan={setWorkoutPlan}
                  weightLogs={weightLogs}
                  onUpdateWeightLogs={setWeightLogs}
                  userProfile={userProfile}
                  onUpdateUserProfile={setUserProfile}
                  sleepLogs={sleepLogs}
                  onUpdateSleepLogs={setSleepLogs}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
               />;
      case 'notes':
        return <NotesView notes={notes} onUpdate={setNotes} />;
      case 'settings':
        return <SettingsView onReplayWelcome={replayWelcome} />;
      default:
        return <DashboardView 
                  transactions={transactions} 
                  foods={foods} 
                  workouts={workouts} 
                  notes={notes} 
                  weightLogs={weightLogs}
                  userProfile={userProfile}
                  sleepLogs={sleepLogs}
                  waterLogs={waterLogs}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  onChangeView={setCurrentView} 
               />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-600 dark:text-zinc-400 font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-white dark:bg-[#0a0a0a]">
        {renderView()}
      </main>
    </div>
  );
}

