import React, { useState } from 'react';
import { WorkoutPlan, WorkoutPlanDay, WorkoutPlanExercise, Workout } from '../../types';
import { generateId } from '../../utils';
import { Loader2, Plus, Sparkles, CheckCircle2, Circle, Dumbbell, Target, Settings2, RotateCcw } from 'lucide-react';

interface WorkoutPlannerProps {
  workoutPlan: WorkoutPlan | null;
  onUpdateWorkoutPlan: (plan: WorkoutPlan | null) => void;
  onAddWorkout?: (workout: Workout) => void;
}

const PRESET_GOALS = ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Fitness'];
const PRESET_EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced'];
const PRESET_TYPES = ['Home Workout', 'Gym', 'Running', 'Calisthenics', 'Yoga', 'HIIT'];
const PRESET_EQUIPMENT = ['None (Bodyweight)', 'Dumbbells', 'Pull-up Bar', 'Resistance Bands', 'Kettlebell', 'Yoga Mat', 'Bench'];

export function WorkoutPlanner({ workoutPlan, onUpdateWorkoutPlan, onAddWorkout }: WorkoutPlannerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [manualInput, setManualInput] = useState('');

  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  
  const [customGoal, setCustomGoal] = useState('');
  
  const toggleSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleParseManual = async () => {
    if (!manualInput) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/parse-workout-plan', {
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
        body: JSON.stringify({ textInput: manualInput })
      });
      
      const data = await response.json();
      
      if (response.ok && data.days) {
        const newPlan: WorkoutPlan = {
          id: generateId(),
          goal: data.goal || 'Custom Plan',
          experience: data.experience || 'Custom',
          types: data.types || [],
          equipment: data.equipment || [],
          days: data.days.map((d: any) => ({
            id: generateId(),
            dayName: d.dayName || 'Day',
            exercises: d.exercises ? d.exercises.map((e: any) => ({
              id: generateId(),
              name: e.name || 'Exercise',
              sets: e.sets || '-',
              reps: e.reps || '-',
              completed: false
            })) : []
          }))
        };
        onUpdateWorkoutPlan(newPlan);
      } else {
        alert(data.error || 'Failed to parse workout plan.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to parse workout plan: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    const finalGoal = goal === 'Custom' && customGoal ? customGoal : goal;
    if (!finalGoal || !experience || types.length === 0) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-workout-plan', {
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
        body: JSON.stringify({ goal: finalGoal, experience, types, equipment })
      });
      
      const data = await response.json();
      
      if (response.ok && data.days) {
        const newPlan: WorkoutPlan = {
          id: generateId(),
          goal: finalGoal,
          experience,
          types,
          equipment,
          days: data.days.map((d: any) => ({
            id: generateId(),
            dayName: d.dayName,
            exercises: d.exercises ? d.exercises.map((e: any) => ({
              id: generateId(),
              name: e.name,
              sets: e.sets,
              reps: e.reps,
              completed: false
            })) : []
          }))
        };
        onUpdateWorkoutPlan(newPlan);
      } else {
        alert(data.error || 'Failed to generate workout plan. Make sure API key is set.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate workout plan: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExercise = (dayId: string, exerciseId: string) => {
    if (!workoutPlan) return;
    
    const updatedPlan = { ...workoutPlan };
    const day = updatedPlan.days.find(d => d.id === dayId);
    if (day) {
      const exercise = day.exercises.find(e => e.id === exerciseId);
      if (exercise) {
        if (!exercise.completed && onAddWorkout) {
          // Estimate calories roughly
          const estimatedCalories = 50; 
          onAddWorkout({
            id: generateId(),
            exercise: exercise.name,
            reps: parseInt(exercise.reps) || undefined,
            caloriesBurned: estimatedCalories,
            date: new Date().toISOString()
          });
        }
        exercise.completed = !exercise.completed;
      }
    }
    
    onUpdateWorkoutPlan(updatedPlan);
  };
  
  const handleResetPlan = () => {
    if (confirm('Are you sure you want to discard your current plan?')) {
      onUpdateWorkoutPlan(null);
    }
  };

  if (workoutPlan) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl">
          <div>
            <h2 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Active Plan: {workoutPlan.goal}
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-full">{workoutPlan.experience}</span>
              {workoutPlan.types.map(t => (
                <span key={t} className="px-2 py-1 bg-emerald-900/30 text-emerald-300 text-xs rounded-full">{t}</span>
              ))}
            </div>
          </div>
          <button 
            onClick={handleResetPlan}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors border border-red-900/50 text-sm whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            New Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workoutPlan.days.map((day) => {
            const progress = day.exercises.length > 0 
              ? (day.exercises.filter(e => e.completed).length / day.exercises.length) * 100 
              : 0;
            const isCompleted = progress === 100 && day.exercises.length > 0;
            const isEmpty = day.exercises.length === 0;

            return (
              <div key={day.id} className={`bg-gradient-to-b from-white to-zinc-50 dark:from-[#141414] dark:to-zinc-950 border ${isCompleted ? 'border-emerald-500/30' : 'border-zinc-200 dark:border-zinc-800'} rounded-2xl p-6 relative overflow-hidden group transition-all`}>
                {isCompleted && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                )}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold">{day.dayName}</h3>
                    {!isEmpty && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">{day.exercises.filter(e => e.completed).length}/{day.exercises.length} Done</span>
                    )}
                  </div>
                  
                  {isEmpty ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 italic py-4">Rest day or active recovery.</p>
                  ) : (
                    <div className="space-y-3">
                      {day.exercises.map(exercise => (
                        <div 
                          key={exercise.id} 
                          onClick={() => toggleExercise(day.id, exercise.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border ${exercise.completed ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:border-zinc-700'} cursor-pointer transition-colors`}
                        >
                          <button className="mt-0.5">
                            {exercise.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-600" />
                            )}
                          </button>
                          <div>
                            <p className={`text-sm font-medium ${exercise.completed ? 'text-zinc-600 dark:text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}>{exercise.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{exercise.sets} sets × {exercise.reps}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            AI Workout Architect
          </h2>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-2">Generate a program or paste your existing routine.</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setCreationMode('ai')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              creationMode === 'ai' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
            }`}
          >
            AI Generate
          </button>
          <button
            onClick={() => setCreationMode('manual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              creationMode === 'manual' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
            }`}
          >
            Paste Plan
          </button>
        </div>
      </div>

      {creationMode === 'manual' ? (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3">Paste your workout schedule</label>
            <textarea
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="E.g., Monday: Chest and Triceps - Bench press 3x10, Tricep pushdowns 3x12. Tuesday: Rest..."
              className="w-full h-48 px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none text-sm"
            />
          </div>
          <button
            onClick={handleParseManual}
            disabled={!manualInput || isGenerating}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-200 dark:bg-zinc-800 disabled:text-zinc-500 dark:text-zinc-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Parsing...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Extract Plan</>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Goal
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_GOALS.map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${goal === g ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#1a1a1a] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-600'}`}
              >
                {g}
              </button>
            ))}
            <button
              onClick={() => setGoal('Custom')}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${goal === 'Custom' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#1a1a1a] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-600'}`}
            >
              Custom
            </button>
          </div>
          {goal === 'Custom' && (
            <input 
              type="text" 
              placeholder="E.g., Increase vertical jump, Rehub knee injury" 
              value={customGoal}
              onChange={e => setCustomGoal(e.target.value)}
              className="mt-3 w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Experience Level
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_EXPERIENCE.map(e => (
              <button
                key={e}
                onClick={() => setExperience(e)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${experience === e ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#1a1a1a] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-600'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> Workout Types (Select multiple)
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_TYPES.map(t => (
              <button
                key={t}
                onClick={() => toggleSelection(t, types, setTypes)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${types.includes(t) ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#1a1a1a] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3">Available Equipment</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_EQUIPMENT.map(e => (
              <button
                key={e}
                onClick={() => toggleSelection(e, equipment, setEquipment)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${equipment.includes(e) ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-600'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!goal || !experience || types.length === 0 || isGenerating}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-200 dark:bg-zinc-800 disabled:text-zinc-500 dark:text-zinc-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-4"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Architecting Plan...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Workout Program
            </>
          )}
        </button>
      </div>
      )}
    </div>
  );
}
