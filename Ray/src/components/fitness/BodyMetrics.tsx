import React, { useState } from 'react';
import { UserProfile, WeightLog } from '../../types';
import { generateId } from '../../utils';
import { Plus, Target, Ruler, Save, Pencil, Trash2, Check, X } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

interface BodyMetricsProps {
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  weightLogs: WeightLog[];
  onUpdateWeightLogs: (logs: WeightLog[]) => void;
}

export function BodyMetrics({ userProfile, onUpdateUserProfile, weightLogs, onUpdateWeightLogs }: BodyMetricsProps) {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(userProfile.height?.toString() || '');
  const [targetWeight, setTargetWeight] = useState(userProfile.targetWeight?.toString() || '');
  const [age, setAge] = useState(userProfile.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | null>(userProfile.gender || null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');

  const sortedLogs = [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = sortedLogs.map(log => ({
    date: format(new Date(log.date), 'MMM d'),
    weight: log.weight
  }));
  // Most recent first, for the editable list below the chart.
  const recentLogs = [...weightLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    const newLog: WeightLog = {
      id: generateId(),
      date: new Date().toISOString(),
      weight: parseFloat(weight)
    };

    onUpdateWeightLogs([...weightLogs, newLog]);
    setWeight('');
  };

  const startEdit = (log: WeightLog) => {
    setEditingId(log.id);
    setEditWeight(log.weight.toString());
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => {
    const parsed = parseFloat(editWeight);
    if (isNaN(parsed) || parsed <= 0) return;
    onUpdateWeightLogs(weightLogs.map(l => l.id === id ? { ...l, weight: parsed } : l));
    setEditingId(null);
  };

  const deleteLog = (id: string) => {
    if (!confirm('Delete this weight entry? This cannot be undone.')) return;
    onUpdateWeightLogs(weightLogs.filter(l => l.id !== id));
  };

  const handleUpdateProfile = () => {
    onUpdateUserProfile({
      ...userProfile,
      height: height ? parseFloat(height) : null,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
      age: age ? parseInt(age, 10) : null,
      gender
    });
    alert('Profile updated');
  };

  const currentWeight = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].weight : null;
  const bmi = currentWeight && userProfile.height ? (currentWeight / Math.pow(userProfile.height / 100, 2)).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface-panel p-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Current Weight</p>
          <p className="text-4xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {currentWeight ? currentWeight.toFixed(1) : '--'} <span className="text-sm font-sans text-zinc-500 dark:text-zinc-500">kg</span>
          </p>
          {userProfile.targetWeight && currentWeight && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
              {Math.abs(currentWeight - userProfile.targetWeight).toFixed(1)} kg to target
            </p>
          )}
        </div>

        <div className="surface-panel p-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Current BMI</p>
          <p className="text-4xl font-mono font-bold text-emerald-400">
            {bmi || '--'}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
            {bmi ? (parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese') : 'Add height and weight'}
          </p>
        </div>

        <div className="surface-panel p-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Target Weight</p>
          <p className="text-4xl font-mono font-bold text-emerald-400">
            {userProfile.targetWeight ? userProfile.targetWeight.toFixed(1) : '--'} <span className="text-sm font-sans text-zinc-500 dark:text-zinc-500">kg</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">Set your goal below</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleLogWeight} className="surface-panel p-6 space-y-4">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Log Weight
            </h3>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g. 75.5"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-xs uppercase tracking-wider"
            >
              Log Today
            </button>
          </form>

          <div className="surface-panel p-6 space-y-4">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg flex items-center gap-2">
              <Ruler className="w-5 h-5 text-emerald-400" /> Body Profile
            </h3>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g. 175"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={e => setTargetWeight(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g. 70.0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g. 30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Gender</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors border ${gender === 'male' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-600'}`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors border ${gender === 'female' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-600'}`}
                >
                  Female
                </button>
              </div>
            </div>
            <button
              onClick={handleUpdateProfile}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="surface-panel p-6 flex flex-col min-h-[300px]">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" /> Progress Curve
            </h3>
            <div className="flex-1 w-full min-h-[250px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-500 italic">
                  Log your weight to see progress over time.
                </div>
              )}
            </div>
          </div>

          <div className="surface-panel p-6">
            <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-4">Weight Log History</h3>
            {recentLogs.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-500 text-sm text-center py-8 italic">No weight entries yet.</p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map(log => {
                  const isEditing = editingId === log.id;
                  return (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-zinc-200 dark:border-zinc-800 group transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">{format(new Date(log.date), 'MMM d, yyyy')}</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            autoFocus
                            value={editWeight}
                            onChange={e => setEditWeight(e.target.value)}
                            className="w-24 px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded text-sm text-right"
                          />
                          <button onClick={() => saveEdit(log.id)} className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={cancelEdit} className="p-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 rounded"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{log.weight.toFixed(1)} <span className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase">kg</span></span>
                          <button onClick={() => startEdit(log)} className="text-zinc-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteLog(log.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
