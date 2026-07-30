import React, { useState, useEffect } from 'react';
import { FoodLog, Workout, WaterLog, UserProfile, FavoriteMeal } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, Loader2, Sparkles, Droplets, Star, X, Undo2 } from 'lucide-react';
import { isSameDay, isToday } from 'date-fns';
import { DateSelector } from '../components/DateSelector';

interface DietViewProps {
  foods: FoodLog[];
  workouts: Workout[];
  waterLogs: WaterLog[];
  userProfile: UserProfile;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onUpdate: (foods: FoodLog[]) => void;
  onUpdateWaterLogs: (logs: WaterLog[]) => void;
  favoriteMeals: FavoriteMeal[];
  onUpdateFavoriteMeals: (meals: FavoriteMeal[]) => void;
}

// Reads the user's configured AI provider/keys/models from localStorage.
// Pulled into one place so every AI call builds its headers the same way.
function getAIHeaders(): Record<string, string> {
  const get = (key: string, fallback = '') =>
    localStorage.getItem(key)?.replace(/"/g, '') || fallback;

  return {
    'Content-Type': 'application/json',
    'x-ai-provider': get('lifehub_ai_provider', 'gemini'),
    'x-gemini-api-key': get('lifehub_gemini_api_key'),
    'x-gemini-model': get('lifehub_gemini_model', 'gemini-2.5-flash'),
    'x-openai-api-key': get('lifehub_openai_api_key'),
    'x-openai-model': get('lifehub_openai_model', 'gpt-4o-mini'),
    'x-anthropic-api-key': get('lifehub_anthropic_api_key'),
    'x-anthropic-model': get('lifehub_anthropic_model', 'claude-3-5-haiku-20241022'),
  };
}

type EstimatedMeal = { name: string; calories: number; protein: number; fat: number; carbs: number };

export function DietView({ foods, workouts, waterLogs, userProfile, selectedDate, setSelectedDate, onUpdate, onUpdateWaterLogs, favoriteMeals, onUpdateFavoriteMeals }: DietViewProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');

  const [mealDescription, setMealDescription] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);

  // Tracks the most recently AI-added entry so we can show a quick
  // "Added X — Save as favorite? / Undo" confirmation right after adding.
  const [lastAdded, setLastAdded] = useState<FoodLog | null>(null);

  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const todayFoods = foods.filter(f => isSameDay(new Date(f.date), selectedDate));
  const todayWorkouts = workouts.filter(w => isSameDay(new Date(w.date), selectedDate));
  const todayWaterLogs = waterLogs.filter(w => isSameDay(new Date(w.date), selectedDate));

  const totalCalories = todayFoods.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = todayFoods.reduce((sum, f) => sum + f.protein, 0);
  const totalFat = todayFoods.reduce((sum, f) => sum + f.fat, 0);
  const totalCarbs = todayFoods.reduce((sum, f) => sum + f.carbs, 0);
  const caloriesBurned = todayWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const totalWater = todayWaterLogs.reduce((sum, w) => sum + w.amount, 0);
  const waterGoal = userProfile.dailyWaterGoal || 2000;
  const waterProgress = Math.min((totalWater / waterGoal) * 100, 100);

  const buildFoodLog = (meal: EstimatedMeal | { name: string; calories: number; protein: number; fat: number; carbs: number }): FoodLog => {
    const d = new Date(selectedDate);
    if (!isToday(selectedDate)) {
      d.setHours(12, 0, 0, 0);
    }
    return {
      id: generateId(),
      name: meal.name,
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      fat: Number(meal.fat) || 0,
      carbs: Number(meal.carbs) || 0,
      date: d.toISOString(),
    };
  };

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;

    const newFood = buildFoodLog({
      name,
      calories: parseFloat(calories),
      protein: parseFloat(protein || '0'),
      fat: parseFloat(fat || '0'),
      carbs: parseFloat(carbs || '0'),
    });

    onUpdate([newFood, ...foods]);
    setName('');
    setCalories('');
    setProtein('');
    setFat('');
    setCarbs('');
  };

  const handleAddWater = (amount: number) => {
    const d = new Date(selectedDate);
    if (!isToday(selectedDate)) {
      d.setHours(12, 0, 0, 0);
    }
    const newLog: WaterLog = {
      id: generateId(),
      date: d.toISOString(),
      amount
    };
    onUpdateWaterLogs([newLog, ...waterLogs]);
  };

  const handleDeleteWater = (id: string) => {
    onUpdateWaterLogs(waterLogs.filter(w => w.id !== id));
  };

  const handleDelete = (id: string) => {
    onUpdate(foods.filter(f => f.id !== id));
    setLastAdded(prev => (prev && prev.id === id ? null : prev));
  };

  // Find frequent meals (e.g. eaten > 2 times across the dataset), excluding
  // anything the user has already explicitly saved as a favorite.
  const favoriteNames = new Set(favoriteMeals.map(f => f.name.toLowerCase().trim()));
  const mealFrequencies: Record<string, { count: number; food: FoodLog }> = {};
  foods.forEach(f => {
    const key = f.name.toLowerCase().trim();
    if (!mealFrequencies[key]) {
      mealFrequencies[key] = { count: 0, food: f };
    }
    mealFrequencies[key].count++;
  });

  const frequentMeals = Object.values(mealFrequencies)
    .filter(v => v.count > 1 && !favoriteNames.has(v.food.name.toLowerCase().trim()))
    .sort((a, b) => b.count - a.count)
    .map(v => v.food)
    .slice(0, 3);

  const handleAddFrequentMeal = (food: FoodLog | FavoriteMeal) => {
    onUpdate([buildFoodLog(food), ...foods]);
  };

  const saveFavorite = (food: { name: string; calories: number; protein: number; fat: number; carbs: number }) => {
    const key = food.name.toLowerCase().trim();
    if (favoriteNames.has(key)) return; // already saved
    const fav: FavoriteMeal = {
      id: generateId(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      fat: food.fat,
      carbs: food.carbs,
    };
    onUpdateFavoriteMeals([fav, ...favoriteMeals]);
  };

  const removeFavorite = (id: string) => {
    onUpdateFavoriteMeals(favoriteMeals.filter(f => f.id !== id));
  };

  const getDietFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const res = await fetch('/api/diet-check', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          calories: totalCalories,
          protein: totalProtein,
          fat: totalFat,
          carbs: totalCarbs,
          burned: caloriesBurned
        })
      });
      const data = await res.json();
      if (res.ok && data.feedback) {
        setAiFeedback(data.feedback);
      } else if (data.error) {
        setAiFeedback('Error: ' + data.error);
      }
    } catch (error: any) {
      console.error(error);
      setAiFeedback('Error: ' + error.message);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // One-step flow: type "4 eggs" -> AI estimates the macros -> the entry is
  // logged immediately. No separate "estimate" then "add" click needed.
  const addViaAI = async () => {
    if (!mealDescription) return;
    setIsEstimating(true);
    setLastAdded(null);
    try {
      const res = await fetch('/api/estimate-macros', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({ mealDescription })
      });
      const data = await res.json();
      if (data && !data.error && data.calories !== undefined) {
        const newFood = buildFoodLog({
          name: data.name || mealDescription,
          calories: data.calories,
          protein: data.protein,
          fat: data.fat,
          carbs: data.carbs,
        });
        onUpdate([newFood, ...foods]);
        setLastAdded(newFood);
        setMealDescription('');
      } else {
        alert(data.error || 'Failed to estimate macros. You can still enter it manually below.');
      }
    } catch (err) {
      console.error(err);
      alert('Error estimating macros. You can still enter it manually below.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleMealDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addViaAI();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Diet & Nutrition</h2>
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
        </div>
      </div>

      <div className="surface-panel p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Macro Architect</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Daily Intake</p>
          </div>
          <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-indigo-400 font-mono">
            {totalCalories.toFixed(0)} kcal
          </div>
        </div>

        <div className="flex justify-around items-center py-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center mb-2 mx-auto">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{totalProtein.toFixed(0)}g</span>
            </div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-500">Protein</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center mb-2 mx-auto">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{totalFat.toFixed(0)}g</span>
            </div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-500">Fat</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-4 border-zinc-300 dark:border-zinc-700 flex items-center justify-center mb-2 mx-auto">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{totalCarbs.toFixed(0)}g</span>
            </div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-500">Carbs</p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-900/10 border border-indigo-900/30 p-5 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-indigo-400 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Planner Insight
          </h3>
          <button
            onClick={getDietFeedback}
            disabled={loadingFeedback || totalCalories === 0}
            className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded hover:bg-indigo-500/30 transition-colors disabled:opacity-50 font-bold uppercase tracking-wider"
          >
            {loadingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
          </button>
        </div>
        {aiFeedback ? (
          <p className="text-indigo-200 text-sm leading-snug">{aiFeedback}</p>
        ) : (
          <p className="text-indigo-200/50 text-sm italic">Log food and request analysis to get personalized insights.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form onSubmit={handleAddFood} className="surface-panel p-6 space-y-4">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-4">Log Nutrition</h3>

            <div className="mb-6 p-4 bg-indigo-900/10 border border-indigo-900/30 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> AI Quick Add
              </label>
              <textarea
                value={mealDescription}
                onChange={e => setMealDescription(e.target.value)}
                onKeyDown={handleMealDescriptionKeyDown}
                placeholder="e.g. 4 eggs, 1 slice of toast, 1 tbsp butter"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-indigo-900/50 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm resize-none h-20"
              />
              <button
                type="button"
                onClick={addViaAI}
                disabled={isEstimating || !mealDescription}
                className="w-full py-1.5 bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 transition-colors font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isEstimating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Split & Add'}
              </button>
              <p className="text-[10px] text-indigo-300/60">Describe what you ate and it's estimated + logged in one step. Press Enter to add.</p>

              {lastAdded && (
                <div className="flex items-center justify-between gap-2 p-2 bg-emerald-900/20 border border-emerald-700/30 rounded-lg text-xs">
                  <span className="text-emerald-300 truncate">
                    Added <strong>{lastAdded.name}</strong> · {lastAdded.calories} kcal
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => { saveFavorite(lastAdded); }}
                      className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400"
                      title="Save as favorite dish"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleDelete(lastAdded.id); }}
                      className="p-1.5 rounded hover:bg-red-500/20 text-red-400"
                      title="Undo"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Food Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="e.g. Chicken Salad"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Calories (kcal)</label>
              <input
                type="number"
                required
                value={calories}
                onChange={e => setCalories(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Pro (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={e => setFat(e.target.value)}
                  className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Carb (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={e => setCarbs(e.target.value)}
                  className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Food
            </button>
          </form>

          {favoriteMeals.length > 0 && (
            <div className="surface-panel p-6 mt-6">
              <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> Favorite Dishes
              </h3>
              <div className="space-y-2">
                {favoriteMeals.map(food => (
                  <div
                    key={food.id}
                    className="w-full flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-amber-900/20 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 rounded-xl transition-all group"
                  >
                    <button
                      onClick={() => handleAddFrequentMeal(food)}
                      className="text-left flex-1"
                      title="Add to today's log"
                    >
                      <p className="text-zinc-800 dark:text-zinc-200 text-sm font-medium">{food.name}</p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1">{food.calories} kcal</p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleAddFrequentMeal(food)} className="p-1.5 text-zinc-600 group-hover:text-amber-400 transition-colors" title="Add">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeFavorite(food.id)} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors" title="Remove favorite">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {frequentMeals.length > 0 && (
            <div className="surface-panel p-6 mt-6">
              <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Often Logged
              </h3>
              <div className="space-y-2">
                {frequentMeals.map((food, idx) => (
                  <div
                    key={idx}
                    className="w-full flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-amber-900/20 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 rounded-xl transition-all group"
                  >
                    <button onClick={() => handleAddFrequentMeal(food)} className="text-left flex-1" title="Add to today's log">
                      <p className="text-zinc-800 dark:text-zinc-200 text-sm font-medium">{food.name}</p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1">{food.calories} kcal</p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => saveFavorite(food)} className="p-1.5 text-zinc-600 hover:text-amber-400 transition-colors" title="Save as favorite">
                        <Star className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleAddFrequentMeal(food)} className="p-1.5 text-zinc-600 group-hover:text-amber-400 transition-colors" title="Add">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="surface-panel p-6 mt-6">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" /> Hydration
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">Daily Progress</span>
              <span className="text-xs font-mono text-zinc-900 dark:text-zinc-100">{totalWater} / {waterGoal} ml</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2.5 mb-6 overflow-hidden">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${waterProgress}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => handleAddWater(250)} className="py-2 bg-blue-900/20 text-blue-400 border border-blue-900/30 rounded-lg hover:bg-blue-900/40 text-xs font-bold transition-colors">+250ml</button>
              <button onClick={() => handleAddWater(500)} className="py-2 bg-blue-900/20 text-blue-400 border border-blue-900/30 rounded-lg hover:bg-blue-900/40 text-xs font-bold transition-colors">+500ml</button>
              <button onClick={() => handleAddWater(1000)} className="py-2 bg-blue-900/20 text-blue-400 border border-blue-900/30 rounded-lg hover:bg-blue-900/40 text-xs font-bold transition-colors">+1L</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="surface-panel p-6">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-6">Today's Log</h3>
            {todayFoods.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-500 text-sm text-center py-8 italic">No food logged today.</p>
            ) : (
              <div className="space-y-3">
                {todayFoods.map(food => (
                  <div key={food.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-zinc-200 dark:border-zinc-800 group transition-colors hover:border-zinc-300 dark:border-zinc-700">
                    <div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{food.name}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mt-1">
                        <span className="text-indigo-400">P: {food.protein}g</span>
                        <span className="text-amber-500">F: {food.fat}g</span>
                        <span className="text-zinc-500 dark:text-zinc-500">C: {food.carbs}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{food.calories} <span className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase">kcal</span></span>
                      <button
                        onClick={() => saveFavorite(food)}
                        disabled={favoriteNames.has(food.name.toLowerCase().trim())}
                        className="text-zinc-600 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all p-1 disabled:text-amber-400 disabled:opacity-100"
                        title={favoriteNames.has(food.name.toLowerCase().trim()) ? 'Already a favorite' : 'Save as favorite dish'}
                      >
                        <Star className={`w-4 h-4 ${favoriteNames.has(food.name.toLowerCase().trim()) ? 'fill-amber-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
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

          {todayWaterLogs.length > 0 && (
            <div className="surface-panel p-6">
              <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-6">Water Intake</h3>
              <div className="space-y-3">
                {todayWaterLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-zinc-200 dark:border-zinc-800 group transition-colors hover:border-zinc-300 dark:border-zinc-700">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">Water</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{log.amount} <span className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase">ml</span></span>
                      <button
                        onClick={() => handleDeleteWater(log.id)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
