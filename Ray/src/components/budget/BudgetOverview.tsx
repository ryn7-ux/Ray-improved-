import React, { useState } from 'react';
import { Transaction, Bucket, Loan } from '../../types';
import { generateId } from '../../utils';
import { Plus, Settings2, Target, PiggyBank, RefreshCw, Trash2, Edit2, X, Check } from 'lucide-react';
import { isToday } from 'date-fns';

interface BudgetOverviewProps {
  transactions: Transaction[];
  buckets: Bucket[];
  onUpdateBuckets: (b: Bucket[]) => void;
  loans: Loan[];
  totalCash: number;
  masterPool: number;
}

export function BudgetOverview({ 
  transactions, 
  buckets, 
  onUpdateBuckets, 
  loans,
  totalCash,
  masterPool 
}: BudgetOverviewProps) {
  const [isAddingBucket, setIsAddingBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketType, setNewBucketType] = useState<'monthly' | 'goal'>('monthly');
  const [newBucketTarget, setNewBucketTarget] = useState('');

  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [editBucketName, setEditBucketName] = useState('');
  const [editBucketType, setEditBucketType] = useState<'monthly' | 'goal'>('monthly');
  const [editBucketTarget, setEditBucketTarget] = useState('');

  const [assignAmounts, setAssignAmounts] = useState<Record<string, string>>({});

  const todayExpenses = transactions.filter(t => t.type === 'expense' && isToday(new Date(t.date)));
  const dailySpendOdometer = todayExpenses.reduce((sum, t) => sum + t.amount, 0);

  const getBucketBalance = (bucket: Bucket) => {
    const expenses = transactions.filter(t => t.type === 'expense' && t.bucketId === bucket.id);
    const spent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const loansFunded = loans.filter(l => l.direction === 'given' && l.fundingBucketId === bucket.id);
    const loaned = loansFunded.reduce((sum, l) => sum + l.principalAmount, 0);
    return bucket.assignedAmount - spent - loaned;
  };

  const handleAddBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName) return;
    const bucket: Bucket = {
      id: generateId(),
      name: newBucketName,
      type: newBucketType,
      targetAmount: newBucketType === 'goal' ? parseFloat(newBucketTarget) : undefined,
      assignedAmount: 0
    };
    onUpdateBuckets([...buckets, bucket]);
    setNewBucketName('');
    setNewBucketTarget('');
    setIsAddingBucket(false);
  };

  const handleAssignMoney = (bucketId: string) => {
    const amount = parseFloat(assignAmounts[bucketId] || '0');
    if (isNaN(amount) || amount === 0) return;
    onUpdateBuckets(buckets.map(b => 
      b.id === bucketId ? { ...b, assignedAmount: b.assignedAmount + amount } : b
    ));
    setAssignAmounts(prev => ({ ...prev, [bucketId]: '' }));
  };

  const handleDeleteBucket = (id: string) => {
    onUpdateBuckets(buckets.filter(b => b.id !== id));
  };

  const handleStartEdit = (b: Bucket) => {
    setEditingBucketId(b.id);
    setEditBucketName(b.name);
    setEditBucketType(b.type);
    setEditBucketTarget(b.targetAmount?.toString() || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editBucketName) return;
    onUpdateBuckets(buckets.map(b => 
      b.id === id ? { 
        ...b, 
        name: editBucketName, 
        type: editBucketType,
        targetAmount: editBucketType === 'goal' ? parseFloat(editBucketTarget) : undefined
      } : b
    ));
    setEditingBucketId(null);
  };

  const handleMonthEndReview = () => {
    const updated = buckets.map(b => {
      const balance = getBucketBalance(b);
      if (b.type === 'monthly' && balance > 0) {
        // Sweep surplus: reduce assignedAmount so balance becomes 0
        return { ...b, assignedAmount: b.assignedAmount - balance };
      }
      return b;
    });
    onUpdateBuckets(updated);
    alert("Month closed! Surplus from monthly budgets has been swept into the Master Pool.");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-panel p-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Total Cash</p>
          <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">{totalCash.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-2xl p-6">
          <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Master Pool</p>
          <p className={`text-3xl font-mono font-bold ${masterPool < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {masterPool.toFixed(2)}
          </p>
          {masterPool < 0 && <p className="text-xs text-red-400 mt-2">Overbudgeted!</p>}
        </div>
        <div className="surface-panel p-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Daily Spend Odometer</p>
          <p className="text-3xl font-mono font-bold text-rose-400">{dailySpendOdometer.toFixed(2)}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">Spent today</p>
        </div>
      </div>

      <div className="surface-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Buckets</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleMonthEndReview}
              className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors font-bold text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> Close Month
            </button>
            <button 
              onClick={() => setIsAddingBucket(!isAddingBucket)}
              className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition-colors font-bold text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> Add Bucket
            </button>
          </div>
        </div>

        {isAddingBucket && (
          <form onSubmit={handleAddBucket} className="bg-[#1a1a1a] p-4 rounded-xl mb-6 space-y-4 border border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Bucket Name</label>
                <input required value={newBucketName} onChange={e => setNewBucketName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm" placeholder="e.g. Groceries" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Type</label>
                <select value={newBucketType} onChange={e => setNewBucketType(e.target.value as any)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm">
                  <option value="monthly">Monthly Budget</option>
                  <option value="goal">Goal (Sinking Fund)</option>
                </select>
              </div>
            </div>
            {newBucketType === 'goal' && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Target Amount</label>
                <input required type="number" value={newBucketTarget} onChange={e => setNewBucketTarget(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm" placeholder="5000" />
              </div>
            )}
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold w-full hover:bg-emerald-500">Save Bucket</button>
          </form>
        )}

        <div className="space-y-4">
          {buckets.length === 0 && <p className="text-zinc-500 dark:text-zinc-500 text-sm py-4 text-center">No buckets created. Start zero-based budgeting!</p>}
          {buckets.map(b => {
            if (editingBucketId === b.id) {
              return (
                <div key={b.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-emerald-500/50 flex flex-col md:flex-row items-center gap-4">
                  <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                    <div>
                      <input required value={editBucketName} onChange={e => setEditBucketName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm" placeholder="Bucket Name" />
                    </div>
                    <div>
                      <select value={editBucketType} onChange={e => setEditBucketType(e.target.value as any)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm">
                        <option value="monthly">Monthly Budget</option>
                        <option value="goal">Goal</option>
                      </select>
                    </div>
                  </div>
                  {editBucketType === 'goal' && (
                    <div className="w-full md:w-auto">
                      <input required type="number" value={editBucketTarget} onChange={e => setEditBucketTarget(e.target.value)} className="w-full md:w-32 px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm" placeholder="Target" />
                    </div>
                  )}
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button onClick={() => setEditingBucketId(null)} className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-800 rounded">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleSaveEdit(b.id)} className="p-2 text-white bg-emerald-600 hover:bg-emerald-500 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            const balance = getBucketBalance(b);
            const isGoal = b.type === 'goal';
            const progress = isGoal && b.targetAmount ? Math.min(100, (balance / b.targetAmount) * 100) : 0;

            return (
              <div key={b.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${isGoal ? 'bg-emerald-900/30 text-emerald-400' : 'bg-blue-900/30 text-blue-400'}`}>
                    {isGoal ? <Target className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-zinc-800 dark:text-zinc-200 font-medium">{b.name}</h4>
                      <button onClick={() => handleStartEdit(b)} className="text-zinc-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteBucket(b.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">Assigned: {b.assignedAmount.toFixed(2)}</p>
                    {isGoal && b.targetAmount && (
                      <div className="mt-2 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden w-full max-w-xs">
                        <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Balance</p>
                    <p className={`font-mono font-bold ${balance < 0 ? 'text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {balance.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                    <input 
                      type="number"
                      placeholder="+ Add amount"
                      value={assignAmounts[b.id] || ''}
                      onChange={e => setAssignAmounts(prev => ({ ...prev, [b.id]: e.target.value }))}
                      className="w-24 px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded text-sm text-right"
                    />
                    <button 
                      onClick={() => handleAssignMoney(b.id)}
                      className="px-2 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 font-bold text-xs"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
