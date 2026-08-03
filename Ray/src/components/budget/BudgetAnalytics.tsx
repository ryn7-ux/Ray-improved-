import React, { useMemo } from 'react';
import { Transaction, Bucket } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

interface BudgetAnalyticsProps {
  transactions: Transaction[];
  buckets: Bucket[];
}

// Emerald-led palette to stay consistent with the app's accent color instead of the old indigo-first set.
const COLORS = ['#10b981', '#34d399', '#f43f5e', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899'];

export function BudgetAnalytics({ transactions, buckets }: BudgetAnalyticsProps) {

  // 1. Categorical Breakdown (Expenses by Bucket)
  const expensesByBucket = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, t) => {
      const bucketName = t.bucketId ? (buckets.find(b => b.id === t.bucketId)?.name || 'Unknown') : 'Unallocated';
      acc[bucketName] = (acc[bucketName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, buckets]);

  // 2. Daily Spend Drill-down (Last 7 Days)
  const dailySpend = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dailyExpenses = transactions.filter(t =>
        t.type === 'expense' && isSameDay(new Date(t.date), date)
      );
      const sum = dailyExpenses.reduce((acc, t) => acc + t.amount, 0);
      data.push({
        day: format(date, 'MMM d'),
        spend: sum
      });
    }
    return data;
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">{label || payload[0].name}</p>
          <p className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="surface-panel p-6">
        <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-6">Categorical Breakdown</h3>
        {expensesByBucket.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByBucket}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {expensesByBucket.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-500 text-sm">
            No expense data available.
          </div>
        )}
      </div>

      <div className="surface-panel p-6">
        <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-6">Daily Spend Burn Rate (7d)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySpend}>
              <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#27272a' }} />
              <Bar dataKey="spend" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
