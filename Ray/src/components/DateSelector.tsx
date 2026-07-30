import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, subDays, addDays, isToday } from 'date-fns';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 w-fit">
      <button 
        onClick={() => onDateChange(subDays(selectedDate, 1))} 
        className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 min-w-[120px] justify-center">
        <Calendar className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-500" />
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
        </span>
      </div>
      <button 
        onClick={() => onDateChange(addDays(selectedDate, 1))} 
        className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-600 dark:text-zinc-400"
        disabled={isToday(selectedDate)}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
