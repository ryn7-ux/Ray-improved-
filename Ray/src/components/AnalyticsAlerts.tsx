import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { FoodLog, SleepLog, UserProfile, WeightLog } from '../types';
import { subDays, isSameDay } from 'date-fns';

interface AnalyticsAlertsProps {
  foods: FoodLog[];
  sleepLogs: SleepLog[];
  userProfile: UserProfile;
  weightLogs: WeightLog[];
  selectedDate: Date;
}

export function AnalyticsAlerts({ foods, sleepLogs, userProfile, weightLogs, selectedDate }: AnalyticsAlertsProps) {
  const alerts: string[] = [];

  // Calculate past 3 days (including selected date)
  const days = [selectedDate, subDays(selectedDate, 1), subDays(selectedDate, 2)];

  // 1. Sleep Analysis
  let poorSleepCount = 0;
  days.forEach(day => {
    const daySleep = sleepLogs.filter(s => isSameDay(new Date(s.date), day));
    if (daySleep.length > 0) {
      // Check if any log for the day was 'poor'
      if (daySleep.some(s => s.quality === 'poor')) {
        poorSleepCount++;
      }
    }
  });

  if (poorSleepCount >= 3) {
    alerts.push("You've had poor sleep for the last 3 days. Please prioritize rest and recovery.");
  }

  // 2. Calorie Analysis
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 70;
  const height = userProfile.height || 170;
  const age = userProfile.age || 30;
  const isMale = userProfile.gender !== 'female';
  const bmr = (10 * currentWeight) + (6.25 * height) - (5 * age) + (isMale ? 5 : -161);

  let lowCalorieCount = 0;
  let highCalorieCount = 0;
  let daysWithFood = 0;

  days.forEach(day => {
    const dayFoods = foods.filter(f => isSameDay(new Date(f.date), day));
    if (dayFoods.length > 0) {
      daysWithFood++;
      const totalCals = dayFoods.reduce((sum, f) => sum + f.calories, 0);
      
      // Extremely low or high calories
      if (totalCals < bmr - 500) lowCalorieCount++;
      if (totalCals > bmr + 1500) highCalorieCount++;
    }
  });

  if (daysWithFood === 3) {
    if (lowCalorieCount >= 3) {
      alerts.push("Your caloric intake has been very low for 3 consecutive days. Ensure you are eating enough to sustain energy levels.");
    }
    if (highCalorieCount >= 3) {
      alerts.push("Your caloric intake has been significantly above your baseline for 3 days. You may want to monitor your portions.");
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <div key={idx} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200/90 leading-relaxed">{alert}</p>
        </div>
      ))}
    </div>
  );
}
