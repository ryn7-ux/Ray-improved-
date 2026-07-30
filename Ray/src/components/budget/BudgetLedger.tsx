import React, { useState } from 'react';
import { Transaction, Bucket } from '../../types';
import { generateId } from '../../utils';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface BudgetLedgerProps {
  transactions: Transaction[];
  onUpdateTransactions: (t: Transaction[]) => void;
  buckets: Bucket[];
}

export function BudgetLedger({ transactions, onUpdateTransactions, buckets }: BudgetLedgerProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(''); // Keep as category or label
  const [bucketId, setBucketId] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    const newTx: Transaction = {
      id: generateId(),
      type,
      amount: parseFloat(amount),
      category,
      bucketId: bucketId || undefined,
      description,
      date: new Date().toISOString(),
    };

    onUpdateTransactions([newTx, ...transactions]);
    setAmount('');
    setDescription('');
    setCategory('');
    setBucketId('');
  };

  const handleDelete = (id: string) => {
    onUpdateTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <form onSubmit={handleAdd} className="surface-panel p-6 space-y-4">
          <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-4">Add Transaction</h3>
          
          <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-4">
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${type === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-500 hover:bg-[#1a1a1a]'}`}
              onClick={() => setType('expense')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-500 hover:bg-[#1a1a1a]'}`}
              onClick={() => setType('income')}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Amount</label>
            <input
              type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Label/Payee</label>
            <input
              type="text" required value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Grocery Store"
            />
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Assign to Bucket</label>
              <select
                value={bucketId} onChange={e => setBucketId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Unallocated (Master Pool) --</option>
                {buckets.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Notes</label>
            <input
              type="text" value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Optional"
            />
          </div>

          <button
            type="submit"
            className={`w-full mt-4 py-2 text-white rounded-lg transition-colors font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            <Plus className="w-4 h-4" /> Add {type === 'expense' ? 'Expense' : 'Income'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2">
        <div className="surface-panel p-6 h-full">
          <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg mb-6">Ledger</h3>
          {transactions.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-500 text-sm text-center py-8 italic">No entries yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(t => {
                const isInc = t.type === 'income';
                const bucketName = buckets.find(b => b.id === t.bucketId)?.name;
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-zinc-200 dark:border-zinc-800 group transition-colors hover:border-zinc-300 dark:border-zinc-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{t.category}</p>
                        {t.bucketId && <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">{bucketName}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        <span>{format(new Date(t.date), 'MMM d, yyyy')}</span>
                        {t.description && <span>• {t.description}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono text-sm font-bold ${isInc ? 'text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {isInc ? '+' : '-'}{t.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
