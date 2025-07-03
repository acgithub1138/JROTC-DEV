import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardTableWrapper } from '@/components/ui/standard-table';
import { BudgetSummaryCards } from './components/BudgetSummaryCards';
import { BudgetTable } from './components/BudgetTable';
import { BudgetFilters } from './components/BudgetFilters';
import { AddIncomeDialog } from './components/AddIncomeDialog';
import { AddExpenseDialog } from './components/AddExpenseDialog';
import { EditBudgetItemDialog } from './components/EditBudgetItemDialog';
import { BudgetCards } from './components/BudgetCards';
import { useBudgetTransactions } from './hooks/useBudgetTransactions';
import { useIsMobile } from '@/hooks/use-mobile';
export interface BudgetTransaction {
  id: string;
  school_id: string;
  item: string;
  category: 'expense' | 'income';
  type: string;
  description?: string;
  date: string;
  amount: number;
  payment_method?: 'cash' | 'check' | 'debit_card' | 'credit_card' | 'other';
  status?: 'pending' | 'paid' | 'not_paid';
  archive: boolean;
  budget_year?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}
export interface BudgetFilters {
  search: string;
  category: string;
  type: string;
  paymentMethod: string;
  status: string;
  showArchived: boolean;
  budgetYear: string;
}
const BudgetManagementPage = () => {
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetTransaction | null>(null);
  const [filters, setFilters] = useState<BudgetFilters>({
    search: '',
    category: '',
    type: '',
    paymentMethod: '',
    status: '',
    showArchived: false,
    budgetYear: ''
  });
  const {
    transactions,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    archiveAllTransactions
  } = useBudgetTransactions(filters);
  const isMobile = useIsMobile();
  
  const handleArchiveAll = async () => {
    const currentYear = new Date().getFullYear();
    const budgetYear = `${currentYear - 1} - ${currentYear}`;
    await archiveAllTransactions(budgetYear);
  };
  return <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">Manage school budget transactions and expenses</p>
        </div>
        <div className="flex gap-2 flex-col md:flex-row">
          <Button onClick={() => setShowAddIncome(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Income
          </Button>
          <Button onClick={() => setShowAddExpense(true)} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
          <Button onClick={handleArchiveAll} variant="outline" className="hidden md:flex">Archive Expenses</Button>
        </div>
      </div>

      <BudgetSummaryCards transactions={transactions} />

      <BudgetFilters filters={filters} onFiltersChange={setFilters} />

      <div className="rounded-lg border bg-card">
        {isMobile ? (
          <BudgetCards transactions={transactions} onEdit={setEditingItem} onDelete={deleteTransaction} />
        ) : (
          <BudgetTable transactions={transactions} isLoading={isLoading} onEdit={setEditingItem} onDelete={deleteTransaction} />
        )}
      </div>

      <AddIncomeDialog open={showAddIncome} onOpenChange={setShowAddIncome} onSubmit={createTransaction} />

      <AddExpenseDialog open={showAddExpense} onOpenChange={setShowAddExpense} onSubmit={createTransaction} />

      {editingItem && <EditBudgetItemDialog open={!!editingItem} onOpenChange={() => setEditingItem(null)} item={editingItem} onSubmit={updateTransaction} />}
    </div>;
};
export default BudgetManagementPage;