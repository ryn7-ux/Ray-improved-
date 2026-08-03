import React, { useState } from 'react';
import { Loan, Repayment, Bucket } from '../../types';
import { generateId } from '../../utils';
import { Plus, Handshake, ArrowDownRight, ArrowUpRight, Pencil, Trash2, Check, X } from 'lucide-react';
import { format, isToday } from 'date-fns';

interface BudgetLoansProps {
  loans: Loan[];
  onUpdateLoans: (l: Loan[]) => void;
  repayments: Repayment[];
  onUpdateRepayments: (r: Repayment[]) => void;
  buckets: Bucket[];
  selectedDate: Date;
}

export function BudgetLoans({ loans, onUpdateLoans, repayments, onUpdateRepayments, buckets, selectedDate }: BudgetLoansProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [personName, setPersonName] = useState('');
  const [direction, setDirection] = useState<'given' | 'received'>('given');
  const [amount, setAmount] = useState('');
  const [fundingBucketId, setFundingBucketId] = useState('');

  const [repayAmounts, setRepayAmounts] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPersonName, setEditPersonName] = useState('');
  const [editPrincipal, setEditPrincipal] = useState('');

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount) return;

    const d = new Date(selectedDate);
    if (!isToday(selectedDate)) {
      d.setHours(12, 0, 0, 0);
    } else {
      d.setTime(Date.now());
    }

    const newLoan: Loan = {
      id: generateId(),
      personName,
      direction,
      principalAmount: parseFloat(amount),
      outstandingBalance: parseFloat(amount),
      fundingBucketId: direction === 'given' ? (fundingBucketId || undefined) : undefined,
      date: d.toISOString()
    };
    onUpdateLoans([...loans, newLoan]);
    setPersonName('');
    setAmount('');
    setFundingBucketId('');
    setIsAdding(false);
  };

  const handleRepay = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const requested = parseFloat(repayAmounts[loanId] || '0');
    if (isNaN(requested) || requested <= 0) return;

    // Never let a repayment exceed what's actually still owed —
    // otherwise cash-flow totals would count more than was really paid.
    const repayAmt = Math.min(requested, loan.outstandingBalance);

    const newRepayment: Repayment = {
      id: generateId(),
      loanId,
      amount: repayAmt,
      date: new Date().toISOString()
    };

    const updatedLoans = loans.map(l =>
      l.id === loanId ? { ...l, outstandingBalance: Math.max(0, l.outstandingBalance - repayAmt) } : l
    );

    onUpdateRepayments([...repayments, newRepayment]);
    onUpdateLoans(updatedLoans);
    setRepayAmounts(prev => ({ ...prev, [loanId]: '' }));
  };

  const startEdit = (loan: Loan) => {
    setEditingId(loan.id);
    setEditPersonName(loan.personName);
    setEditPrincipal(loan.principalAmount.toString());
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => {
    if (!editPersonName || !editPrincipal) return;
    const newPrincipal = parseFloat(editPrincipal);
    if (isNaN(newPrincipal) || newPrincipal < 0) return;

    onUpdateLoans(loans.map(l => {
      if (l.id !== id) return l;
      // Preserve however much has already been repaid when the principal changes.
      const alreadyRepaid = l.principalAmount - l.outstandingBalance;
      const newOutstanding = Math.max(0, newPrincipal - alreadyRepaid);
      return { ...l, personName: editPersonName, principalAmount: newPrincipal, outstandingBalance: newOutstanding };
    }));
    setEditingId(null);
  };

  const handleDeleteLoan = (id: string) => {
    if (!confirm('Delete this loan contract and its repayment history? This cannot be undone.')) return;
    onUpdateLoans(loans.filter(l => l.id !== id));
    onUpdateRepayments(repayments.filter(r => r.loanId !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center surface-panel p-6">
        <div>
          <h3 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg flex items-center gap-2">
            <Handshake className="w-5 h-5 text-emerald-400" /> Lending & Borrowing
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Standalone peer-to-peer ledger</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Contract
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddLoan} className="bg-[#1a1a1a] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-4">
            <button type="button" className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${direction === 'given' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-500'}`} onClick={() => setDirection('given')}>I am lending out</button>
            <button type="button" className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${direction === 'received' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-500'}`} onClick={() => setDirection('received')}>I am borrowing</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Person/Entity Name</label>
              <input required value={personName} onChange={e => setPersonName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm" placeholder="e.g. Alice" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Principal Amount</label>
              <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm" placeholder="100.00" />
            </div>
          </div>

          {direction === 'given' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Fund from Bucket (Optional)</label>
              <select value={fundingBucketId} onChange={e => setFundingBucketId(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm">
                <option value="">-- Direct from Master Pool --</option>
                {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded text-sm font-bold mt-2">Save Contract</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loans.map(loan => {
          const isGiven = loan.direction === 'given';
          const isSettled = loan.outstandingBalance <= 0;
          const isEditing = editingId === loan.id;

          if (isEditing) {
            return (
              <div key={loan.id} className="p-5 rounded-2xl border border-emerald-500/50 bg-zinc-50 dark:bg-[#141414] space-y-3">
                <input value={editPersonName} onChange={e => setEditPersonName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm" placeholder="Person/Entity Name" />
                <input type="number" step="0.01" value={editPrincipal} onChange={e => setEditPrincipal(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm" placeholder="Principal Amount" />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500">Repayment history is preserved when you change the principal.</p>
                <div className="flex justify-end gap-2">
                  <button onClick={cancelEdit} className="p-2 text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700"><X className="w-4 h-4" /></button>
                  <button onClick={() => saveEdit(loan.id)} className="p-2 text-white bg-emerald-600 hover:bg-emerald-500 rounded"><Check className="w-4 h-4" /></button>
                </div>
              </div>
            );
          }

          return (
            <div key={loan.id} className={`p-5 rounded-2xl border ${isSettled ? 'border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#141414]/50' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414]'} relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-3 flex items-center gap-1">
                {isSettled && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold uppercase tracking-wider mr-1">Settled</span>}
                <button onClick={() => startEdit(loan)} className="text-zinc-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDeleteLoan(loan.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isGiven ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {isGiven ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className={`font-semibold ${isSettled ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{loan.personName}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">{isGiven ? 'Owes you' : 'You owe'} • {format(new Date(loan.date), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Principal</p>
                  <p className="text-lg font-mono text-zinc-700 dark:text-zinc-300">{loan.principalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Outstanding</p>
                  <p className={`text-lg font-mono font-bold ${isSettled ? 'text-zinc-500 dark:text-zinc-500' : (isGiven ? 'text-emerald-400' : 'text-rose-400')}`}>
                    {loan.outstandingBalance.toFixed(2)}
                  </p>
                </div>
              </div>

              {!isSettled && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                  <input
                    type="number" step="0.01" max={loan.outstandingBalance} placeholder={`Up to ${loan.outstandingBalance.toFixed(2)}`}
                    value={repayAmounts[loan.id] || ''} onChange={e => setRepayAmounts(prev => ({ ...prev, [loan.id]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded text-sm"
                  />
                  <button onClick={() => handleRepay(loan.id)} className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded font-bold text-xs">
                    Log Repayment
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {loans.length === 0 && (
          <div className="col-span-full py-12 text-center border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl">
            <Handshake className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">No active contracts.</p>
            <p className="text-zinc-600 text-sm mt-1">Lend or borrow money to see it tracked here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
