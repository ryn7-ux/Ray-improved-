import React, { useState } from 'react';
import { Transaction, Bucket, Loan, Repayment } from '../types';
import { BudgetOverview } from '../components/budget/BudgetOverview';
import { BudgetLedger } from '../components/budget/BudgetLedger';
import { BudgetLoans } from '../components/budget/BudgetLoans';
import { BudgetAnalytics } from '../components/budget/BudgetAnalytics';
import { Target, BookOpen, Handshake, BarChart2 } from 'lucide-react';
import { DateSelector } from '../components/DateSelector';

interface BudgetViewProps {
  transactions: Transaction[];
  onUpdateTransactions: (t: Transaction[]) => void;
  buckets: Bucket[];
  onUpdateBuckets: (b: Bucket[]) => void;
  loans: Loan[];
  onUpdateLoans: (l: Loan[]) => void;
  repayments: Repayment[];
  onUpdateRepayments: (r: Repayment[]) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

type TabType = 'overview' | 'ledger' | 'loans' | 'analytics';

export function BudgetView({
  transactions, onUpdateTransactions,
  buckets, onUpdateBuckets,
  loans, onUpdateLoans,
  repayments, onUpdateRepayments,
  selectedDate, setSelectedDate
}: BudgetViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Math Engine Core Logic
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const totalLoansGiven = loans.filter(l => l.direction === 'given').reduce((sum, l) => sum + l.principalAmount, 0);
  const totalLoansReceived = loans.filter(l => l.direction === 'received').reduce((sum, l) => sum + l.principalAmount, 0);

  const repaymentsReceived = repayments.filter(r => {
    const loan = loans.find(l => l.id === r.loanId);
    return loan?.direction === 'given';
  }).reduce((sum, r) => sum + r.amount, 0);

  const repaymentsMade = repayments.filter(r => {
    const loan = loans.find(l => l.id === r.loanId);
    return loan?.direction === 'received';
  }).reduce((sum, r) => sum + r.amount, 0);

  const totalCash = totalIncome - totalExpense - totalLoansGiven + totalLoansReceived + repaymentsReceived - repaymentsMade;
  const totalAssigned = buckets.reduce((sum, b) => sum + b.assignedAmount, 0);
  const masterPool = totalCash - totalAssigned;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">Treasury</h1>
            {(activeTab === 'ledger' || activeTab === 'loans') && (
              <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1">Direct your capital purposefully.</p>
        </div>

        <div className="flex surface-panel p-1 overflow-x-auto">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Target className="w-4 h-4" />} label="Overview" />
          <TabButton active={activeTab === 'ledger'} onClick={() => setActiveTab('ledger')} icon={<BookOpen className="w-4 h-4" />} label="Ledger" />
          <TabButton active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} icon={<Handshake className="w-4 h-4" />} label="Lending" />
          <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart2 className="w-4 h-4" />} label="Analytics" />
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <BudgetOverview
            transactions={transactions}
            buckets={buckets}
            onUpdateBuckets={onUpdateBuckets}
            loans={loans}
            totalCash={totalCash}
            masterPool={masterPool}
          />
        )}

        {activeTab === 'ledger' && (
          <BudgetLedger
            transactions={transactions}
            onUpdateTransactions={onUpdateTransactions}
            buckets={buckets}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'loans' && (
          <BudgetLoans
            loans={loans}
            onUpdateLoans={onUpdateLoans}
            repayments={repayments}
            onUpdateRepayments={onUpdateRepayments}
            buckets={buckets}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'analytics' && (
          <BudgetAnalytics
            transactions={transactions}
            buckets={buckets}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-emerald-600 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
