import React, { useState } from 'react';
import { SleepLog } from '../../types';
import { generateId } from '../../utils';
import { Moon, Sun, Plus, Clock } from 'lucide-react';
import { format, differenceInMinutes, isToday } from 'date-fns';

interface SleepTrackerProps {
  sleepLogs: SleepLog[];
  onUpdateSleepLogs: (logs: SleepLog[]) => void;
  selectedDate: Date;
}

export function SleepTracker({ sleepLogs, onUpdateSleepLogs, selectedDate }: SleepTrackerProps) {
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');

  const sortedLogs = [...sleepLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddSleep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedTime || !wakeTime) return;

    const [startHour, startMin] = bedTime.split(':').map(Number);
    const [endHour, endMin] = wakeTime.split(':').map(Number);
    
    let startMins = startHour * 60 + startMin;
    let endMins = endHour * 60 + endMin;

    if (endMins < startMins) {
      endMins += 24 * 60; // Next day
    }

    const durationMins = endMins - startMins;
    const hours = durationMins / 60;

    let quality: 'poor' | 'fair' | 'good' | 'excellent' = 'good';
    if (hours < 5) quality = 'poor';
    else if (hours < 6.5) quality = 'fair';
    else if (hours <= 8.5) quality = 'excellent';
    else quality = 'good';

    const d = new Date(selectedDate);
    if (!isToday(selectedDate)) {
      d.setHours(12, 0, 0, 0);
    }

    const newLog: SleepLog = {
      id: generateId(),
      date: d.toISOString(),
      bedTime,
      wakeTime,
      quality
    };

    onUpdateSleepLogs([newLog, ...sleepLogs]);
    setBedTime('');
    setWakeTime('');
  };

  const calculateDuration = (start: string, end: string) => {
    try {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      
      let startMins = startHour * 60 + startMin;
      let endMins = endHour * 60 + endMin;

      if (endMins < startMins) {
        endMins += 24 * 60; // Next day
      }

      const diff = endMins - startMins;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return '--';
    }
  };

  const getQualityColor = (q?: string) => {
    switch(q) {
      case 'excellent': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'good': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'fair': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'poor': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleAddSleep} className="lg:col-span-1 surface-panel p-6 space-y-4">
          <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" /> Log Sleep
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Bed Time</label>
            <input
              type="time"
              required
              value={bedTime}
              onChange={e => setBedTime(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Wake Time</label>
            <input
              type="time"
              required
              value={wakeTime}
              onChange={e => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-bold text-xs uppercase tracking-wider mt-4"
          >
            Log Sleep Session
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {sortedLogs.map((log) => (
            <div key={log.id} className="surface-panel p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl">
                  <Moon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                    {format(new Date(log.date), 'EEEE, MMM do')}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> {log.bedTime}</span>
                    <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-amber-400" /> {log.wakeTime}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-end gap-1">
                  <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-500" />
                  {calculateDuration(log.bedTime, log.wakeTime)}
                </p>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold mt-1 border ${getQualityColor(log.quality)}`}>
                  {log.quality}
                </span>
              </div>
            </div>
          ))}
          {sortedLogs.length === 0 && (
            <div className="surface-panel p-8 text-center text-zinc-500 dark:text-zinc-500">
              No sleep logs yet. Start tracking to understand your recovery.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
