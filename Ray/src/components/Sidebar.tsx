import React from 'react';
import { Activity, BookOpen, LayoutDashboard, Utensils, Wallet, Settings, Moon, Sun } from 'lucide-react';
import { ViewType } from '../types';
import { cn } from '../utils';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export function Sidebar({ currentView, onChangeView, theme, toggleTheme }: SidebarProps) {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'budget', label: 'Budget', icon: <Wallet className="w-5 h-5" /> },
    { id: 'diet', label: 'Diet', icon: <Utensils className="w-5 h-5" /> },
    { id: 'fitness', label: 'Fitness', icon: <Activity className="w-5 h-5" /> },
    { id: 'notes', label: 'Notes', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="w-full md:w-64 bg-zinc-50 dark:bg-[#0d0d0d] border-r border-zinc-200 dark:border-zinc-800 flex md:flex-col p-4 overflow-x-auto z-10 sticky top-0 md:h-screen">
      <div className="hidden md:flex items-center justify-between gap-2 mb-8 px-2">
        <h1 className="font-display text-zinc-900 dark:text-zinc-100 font-bold tracking-tight text-2xl italic">
          RYN<span className="text-emerald-500">HUB</span>
        </h1>
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <nav className="flex md:flex-col gap-2 flex-1 w-full justify-between md:justify-start uppercase tracking-widest text-sm">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold transition-all duration-200 border-l-2 md:border-l-2 border-transparent",
              currentView === item.id
                ? "text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-900/70 border-emerald-500"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800/30"
            )}
          >
            <span className={currentView === item.id ? "text-emerald-500" : ""}>{item.icon}</span>
            <span className="hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="hidden md:flex items-center justify-between mt-auto">
        <div className="text-[10px] text-zinc-400 dark:text-zinc-700 font-medium tracking-widest uppercase px-2">
          V.2.0.4 - STABLE
        </div>
      </div>
    </div>
  );
}
