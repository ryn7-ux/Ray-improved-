import { Transaction, FoodLog, Workout, Note, WeightLog, UserProfile, SleepLog, WaterLog } from '../types';
import { isSameDay, format } from 'date-fns';
import { Wallet, Utensils, Activity, BookOpen, ChevronRight, Scale, Heart, Moon, Droplets } from 'lucide-react';
import { ViewType } from '../types';
import { DateSelector } from '../components/DateSelector';
import { AnalyticsAlerts } from '../components/AnalyticsAlerts';

interface DashboardViewProps {
  transactions: Transaction[];
  foods: FoodLog[];
  workouts: Workout[];
  notes: Note[];
  weightLogs: WeightLog[];
  userProfile: UserProfile;
  sleepLogs: SleepLog[];
  waterLogs: WaterLog[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onChangeView: (view: ViewType) => void;
}

export function DashboardView({ transactions, foods, workouts, notes, weightLogs, userProfile, sleepLogs, waterLogs, selectedDate, setSelectedDate, onChangeView }: DashboardViewProps) {
  const todayExpenses = transactions.filter(t => t.type === 'expense' && isSameDay(new Date(t.date), selectedDate));
  const todayFoods = foods.filter(f => isSameDay(new Date(f.date), selectedDate));
  const todayWorkouts = workouts.filter(w => isSameDay(new Date(w.date), selectedDate));
  const todaySleep = sleepLogs.filter(s => isSameDay(new Date(s.date), selectedDate))[0];
  const todayWaterLogs = waterLogs.filter(w => isSameDay(new Date(w.date), selectedDate));

  const totalSpentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCaloriesToday = todayFoods.reduce((sum, f) => sum + f.calories, 0);
  const caloriesBurnedToday = todayWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const totalWater = todayWaterLogs.reduce((sum, w) => sum + w.amount, 0);
  const waterGoal = userProfile.dailyWaterGoal || 2000;
  
  // Basic BMR calculation (Mifflin-St Jeor equation approx)
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 70; // Default 70kg if no log
  const height = userProfile.height || 170; // Default 170cm
  const age = userProfile.age || 30; // Default 30
  const isMale = userProfile.gender !== 'female';
  
  const bmr = (10 * currentWeight) + (6.25 * height) - (5 * age) + (isMale ? 5 : -161);
  const totalEnergyExpenditure = bmr + caloriesBurnedToday;
  const netCalories = totalCaloriesToday - totalEnergyExpenditure;
  const latestNote = notes[0];

  // Calculate Health Score (0-100)
  let healthScore = 50; // Base score
  
  // Factor 1: Net Calories vs Goal
  if (userProfile.targetWeight) {
    const isWeightLossGoal = userProfile.targetWeight < currentWeight;
    if (isWeightLossGoal && netCalories < 0) healthScore += 20;
    else if (!isWeightLossGoal && netCalories > 0) healthScore += 20;
    else healthScore -= 10;
  } else {
    // Maintenance: stay within +/- 300 kcal
    if (Math.abs(netCalories) <= 300) healthScore += 20;
  }

  // Factor 2: Activity
  if (caloriesBurnedToday > 300) healthScore += 15;
  else if (caloriesBurnedToday > 0) healthScore += 5;

  // Factor 3: Sleep
  if (todaySleep) {
    if (todaySleep.quality === 'excellent') healthScore += 10;
    if (todaySleep.quality === 'good') healthScore += 5;
    if (todaySleep.quality === 'poor') healthScore -= 10;
  }

  // Factor 4: Hydration
  if (totalWater >= waterGoal) healthScore += 10;
  else if (totalWater >= waterGoal * 0.5) healthScore += 5;

  healthScore = Math.max(0, Math.min(100, healthScore));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Dashboard</h2>
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Summary for {format(selectedDate, 'EEEE, MMMM do')}</p>
        </div>
        
        <div className="surface-panel p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Daily health score</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-50">{healthScore}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-500 mb-1">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      <AnalyticsAlerts 
        foods={foods} 
        sleepLogs={sleepLogs} 
        userProfile={userProfile} 
        weightLogs={weightLogs} 
        selectedDate={selectedDate} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Budget Card */}
        <div 
          onClick={() => onChangeView('budget')}
          className="surface-panel p-5 cursor-pointer flex flex-col"
        >
          <div className="stat-tile mb-4">
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Spent today</p>
          <p className="text-zinc-900 dark:text-zinc-50 font-mono text-3xl font-bold">{totalSpentToday.toFixed(2)}</p>
        </div>

        {/* Diet Card */}
        <div 
          onClick={() => onChangeView('diet')}
          className="surface-panel p-5 cursor-pointer flex flex-col"
        >
          <div className="stat-tile mb-4">
            <Utensils className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Calories in</p>
          <p className="text-zinc-900 dark:text-zinc-50 font-mono text-3xl font-bold">{totalCaloriesToday.toFixed(0)} <span className="text-xs text-zinc-500 dark:text-zinc-500 font-sans">kcal</span></p>
        </div>

        {/* Fitness Card */}
        <div 
          onClick={() => onChangeView('fitness')}
          className="surface-panel p-5 cursor-pointer flex flex-col"
        >
          <div className="stat-tile mb-4">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Calories out</p>
          <p className="text-zinc-900 dark:text-zinc-50 font-mono text-3xl font-bold">{caloriesBurnedToday.toFixed(0)} <span className="text-xs text-zinc-500 dark:text-zinc-500 font-sans">kcal</span></p>
        </div>

        {/* Net Energy Card */}
        <div 
          onClick={() => onChangeView('fitness')}
          className="surface-panel p-5 cursor-pointer flex flex-col"
        >
          <div className="stat-tile mb-4">
            <Scale className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Net energy</p>
          <p className={`font-mono text-3xl font-bold ${netCalories > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {netCalories > 0 ? '+' : ''}{netCalories.toFixed(0)} <span className="text-xs text-zinc-500 dark:text-zinc-500 font-sans">kcal</span>
          </p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 uppercase tracking-wider">Incl BMR: {bmr.toFixed(0)} kcal</p>
        </div>

        {/* Sleep Card */}
        <div 
          onClick={() => onChangeView('fitness')}
          className="surface-panel p-5 cursor-pointer flex flex-col"
        >
          <div className="stat-tile mb-4">
            <Moon className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Sleep quality</p>
          {todaySleep ? (
            <>
              <p className="text-zinc-900 dark:text-zinc-50 font-bold capitalize text-3xl">{todaySleep.quality}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Logged {todaySleep.bedTime} - {todaySleep.wakeTime}</p>
            </>
          ) : (
            <>
              <p className="text-zinc-600 dark:text-zinc-400 font-bold text-3xl">--</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Not logged today</p>
            </>
          )}
        </div>

        {/* Hydration Card */}
        <div 
          onClick={() => onChangeView('diet')}
          className="surface-panel p-5 cursor-pointer flex flex-col"
        >
          <div className="stat-tile mb-4">
            <Droplets className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Hydration</p>
          <p className="font-mono text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {totalWater} <span className="text-xs text-zinc-500 dark:text-zinc-500 font-sans">ml</span>
          </p>
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1 rounded-full" 
              style={{ width: `${Math.min((totalWater / waterGoal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Latest Note */}
      <div 
        onClick={() => onChangeView('notes')}
        className="surface-panel p-6 cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-1">Ideation Studio</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Latest note</p>
          </div>
          <BookOpen className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
        </div>
        <div className="bg-zinc-50 dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-zinc-800/70 p-4">
          {latestNote ? (
            <>
              <p className="text-zinc-500 dark:text-zinc-500 text-xs italic mb-2">Drafted {format(new Date(latestNote.date), 'MMM d, h:mm a')}</p>
              <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{latestNote.content}</p>
            </>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-500 italic">No ephemeral thoughts yet. Start writing...</p>
          )}
        </div>
      </div>
    </div>
  );
}
