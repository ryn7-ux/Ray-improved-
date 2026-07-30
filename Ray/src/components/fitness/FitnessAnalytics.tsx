import React, { useMemo } from 'react';
import { Workout } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip as RechartsTooltip, Cell, ReferenceLine } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

interface FitnessAnalyticsProps {
  workouts: Workout[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl">
        <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">{label}</p>
        <p className="text-amber-500 font-mono font-bold">{payload[0].value.toFixed(0)} kcal</p>
      </div>
    );
  }
  return null;
};

export function FitnessAnalytics({ workouts }: FitnessAnalyticsProps) {
  const dailyBurn = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dailyWorkouts = workouts.filter(w => isSameDay(new Date(w.date), date));
      const sum = dailyWorkouts.reduce((acc, w) => acc + w.caloriesBurned, 0);
      data.push({
        day: format(date, 'MMM d'),
        burn: sum,
        isToday: i === 0
      });
    }
    return data;
  }, [workouts]);

  return (
    <div className="surface-panel p-6 h-full flex flex-col">
      <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-6">7-Day Burn Rate</h3>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyBurn}>
            <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#27272a' }} />
            <ReferenceLine y={400} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
            <Bar dataKey="burn" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {dailyBurn.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isToday ? '#f59e0b' : '#451a03'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
