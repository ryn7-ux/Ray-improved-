import React, { useState } from 'react';
import { Workout, WorkoutPlan, WeightLog, UserProfile, SleepLog } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, Loader2, Dumbbell, Flame } from 'lucide-react';
import { isSameDay, isToday, format } from 'date-fns';
import { FitnessAnalytics } from '../components/fitness/FitnessAnalytics';
import { WorkoutPlanner } from '../components/fitness/WorkoutPlanner';
import { BodyMetrics } from '../components/fitness/BodyMetrics';
import { SleepTracker } from '../components/fitness/SleepTracker';
import { DateSelector } from '../components/DateSelector';

interface FitnessViewProps {
  workouts: Workout[];
  onUpdate: (workouts: Workout[]) => void;
  workoutPlan: WorkoutPlan | null;
  onUpdateWorkoutPlan: (plan: WorkoutPlan | null) => void;
  weightLogs: WeightLog[];
  onUpdateWeightLogs: (logs: WeightLog[]) => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  sleepLogs: SleepLog[];
  onUpdateSleepLogs: (logs: SleepLog[]) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export function FitnessView({ workouts, onUpdate, workoutPlan, onUpdateWorkoutPlan, weightLogs, onUpdateWeightLogs, userProfile, onUpdateUserProfile, sleepLogs, onUpdateSleepLogs, selectedDate, setSelectedDate }: FitnessViewProps) {
  const [exercise, setExercise] = useState('');
  const [reps, setReps] = useState('');
  const [duration, setDuration] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [activeTab, setActiveTab] = useState<'log' | 'planner' | 'body' | 'sleep'>('log');

  const workoutsList = workouts;
  const todayWorkouts = workouts.filter(w => isSameDay(new Date(w.date), selectedDate));
  const caloriesBurnedToday = todayWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0);

  const totalTimeToday = todayWorkouts.reduce((sum, w) => sum + (w.durationMins || 0), 0);
  const totalWorkoutsCount = workouts.length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise) return;

    setIsEstimating(true);
    let estimatedCalories = 0;

    try {
      const res = await fetch('/api/estimate-calories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-ai-provider': localStorage.getItem('lifehub_ai_provider')?.replace(/"/g, '') || 'gemini',
          'x-gemini-api-key': localStorage.getItem('lifehub_gemini_api_key')?.replace(/"/g, '') || '',
          'x-gemini-model': localStorage.getItem('lifehub_gemini_model')?.replace(/"/g, '') || 'gemini-1.5-flash',
          'x-openai-api-key': localStorage.getItem('lifehub_openai_api_key')?.replace(/"/g, '') || '',
          'x-openai-model': localStorage.getItem('lifehub_openai_model')?.replace(/"/g, '') || 'gpt-4o-mini',
          'x-anthropic-api-key': localStorage.getItem('lifehub_anthropic_api_key')?.replace(/"/g, '') || '',
          'x-anthropic-model': localStorage.getItem('lifehub_anthropic_model')?.replace(/"/g, '') || 'claude-3-haiku-20240307'
        },
        body: JSON.stringify({
          exercise,
          reps: reps ? parseInt(reps) : undefined,
          durationMins: duration ? parseInt(duration) : undefined,
        })
      });
      const data = await res.json();
      if (res.ok && data.caloriesBurned) {
        estimatedCalories = data.caloriesBurned;
      } else if (res.ok && data.calories) {
        estimatedCalories = data.calories;
      } else if (data.error) {
        alert("AI Estimation Error: " + data.error);
        estimatedCalories = (duration ? parseInt(duration) * 5 : 50); 
      }
    } catch (err: any) {
      console.error(err);
      alert("AI Estimation Error: " + err.message);
      estimatedCalories = (duration ? parseInt(duration) * 5 : 50); 
    }

    const d = new Date(selectedDate);
    if (!isToday(selectedDate)) {
      d.setHours(12, 0, 0, 0);
    }

    const newWorkout: Workout = {
      id: generateId(),
      exercise,
      reps: reps ? parseInt(reps) : undefined,
      durationMins: duration ? parseInt(duration) : undefined,
      caloriesBurned: estimatedCalories,
      date: d.toISOString(),
    };

    onUpdate([newWorkout, ...workouts]);
    setExercise('');
    setReps('');
    setDuration('');
    setIsEstimating(false);
  };

  const handleAddWorkout = (workout: Workout) => {
    onUpdate([workout, ...workouts]);
  };

  const handleDelete = (id: string) => {
    onUpdate(workouts.filter(w => w.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">Kinetics & Body</h1>
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1">Track your active performance, plan workouts, and monitor body metrics.</p>
        </div>
      </div>

      <div className="flex surface-panel p-1 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('log')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'log' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Activity Log
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'planner' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
          }`}
        >
          AI Workout Planner
        </button>
        <button
          onClick={() => setActiveTab('body')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'body' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Body Metrics
        </button>
        <button
          onClick={() => setActiveTab('sleep')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'sleep' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Sleep Tracking
        </button>
      </div>

      {activeTab === 'sleep' && (
        <SleepTracker sleepLogs={sleepLogs} onUpdateSleepLogs={onUpdateSleepLogs} selectedDate={selectedDate} />
      )}

      {activeTab === 'body' && (
        <BodyMetrics 
          weightLogs={weightLogs} 
          onUpdateWeightLogs={onUpdateWeightLogs} 
          userProfile={userProfile} 
          onUpdateUserProfile={onUpdateUserProfile} 
        />
      )}

      {activeTab === 'planner' && (
        <WorkoutPlanner workoutPlan={workoutPlan} onUpdateWorkoutPlan={onUpdateWorkoutPlan} onAddWorkout={handleAddWorkout} />
      )}
      
      {activeTab === 'log' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-b from-white to-zinc-50 dark:from-[#141414] dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-300 dark:border-zinc-700 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Calories Burnt Today</p>
            <p className="text-4xl font-mono font-bold text-amber-500">{caloriesBurnedToday.toFixed(0)} <span className="text-sm font-sans text-zinc-600">kcal</span></p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">{todayWorkouts.length} session(s) today</p>
          </div>
        </div>

        <div className="surface-panel p-6 relative overflow-hidden hover:border-zinc-300 dark:border-zinc-700 transition-colors">
          <div className="relative z-10">
            <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Active Time Today</p>
            <p className="text-4xl font-mono font-bold text-zinc-900 dark:text-zinc-100">{totalTimeToday} <span className="text-sm font-sans text-zinc-600">mins</span></p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">Logged duration</p>
          </div>
        </div>

        <div className="surface-panel p-6 relative overflow-hidden hover:border-zinc-300 dark:border-zinc-700 transition-colors">
          <div className="relative z-10">
            <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Total Logged Sessions</p>
            <p className="text-4xl font-mono font-bold text-zinc-900 dark:text-zinc-100">{totalWorkoutsCount}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">All time workouts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form onSubmit={handleAdd} className="surface-panel p-6 space-y-4">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-4">Log Activity</h3>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Exercise Name</label>
              <input
                type="text"
                required
                value={exercise}
                onChange={e => setExercise(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g. Pushups, Running"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Reps/Sets</label>
                <input
                  type="number"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Duration (m)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800 italic">
              AI estimates calories burned based on exercise data.
            </p>

            <button
              type="submit"
              disabled={isEstimating || !exercise}
              className="w-full mt-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isEstimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isEstimating ? 'Estimating...' : 'Log Exercise'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="surface-panel p-6 h-full">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-6">Recent Activity</h3>
            {workouts.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-500 text-sm text-center py-8 italic">No workouts logged yet. Get moving!</p>
            ) : (
              <div className="space-y-3">
                {workouts.map(workout => (
                  <div key={workout.id} className="flex items-center gap-4 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 group transition-colors hover:border-zinc-300 dark:border-zinc-700">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase">
                      {workout.exercise.substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 capitalize">{workout.exercise}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {workout.reps && `${workout.reps} reps `}
                        {workout.reps && workout.durationMins && `• `}
                        {workout.durationMins && `${workout.durationMins} mins `}
                        • {format(new Date(workout.date), 'MMM d')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                         <span className="font-mono font-bold text-amber-500">{workout.caloriesBurned}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase font-bold ml-1">kcal</span>
                      </div>
                      <button
                        onClick={() => handleDelete(workout.id)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FitnessAnalytics workouts={workoutsList} />
      </div>
        </>
      )}
    </div>
  );
}
