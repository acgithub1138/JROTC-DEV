import React, { useState } from 'react';
import { Plus, FileDown, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StandardTableWrapper } from '@/components/ui/standard-table';
import { BudgetSummaryCards } from './components/BudgetSummaryCards';
import { BudgetTable } from './components/BudgetTable';
import { BudgetFilters } from './components/BudgetFilters';
import { EditBudgetItemDialog } from './components/EditBudgetItemDialog';
import { DeleteBudgetDialog } from './components/DeleteBudgetDialog';
import { BudgetCards } from './components/BudgetCards';
import { useBudgetTransactions } from './hooks/useBudgetTransactions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useExportBudgetTransactions } from './hooks/useExportBudgetTransactions';
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
  active?: boolean;
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
  const navigate = useNavigate();
  const { canCreate, canEdit: canUpdate, canView } = useTablePermissions('budget');
  const { exportToExcel, isExporting } = useExportBudgetTransactions();
  const [editingItem, setEditingItem] = useState<BudgetTransaction | null>(null);
  const [deletingItem, setDeletingItem] = useState<BudgetTransaction | null>(null);
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

  const handleDeleteTransaction = (transaction: BudgetTransaction) => {
    setDeletingItem(transaction);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteTransaction(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const handleAddIncome = () => {
    navigate('/app/budget/income_record?mode=create');
  };

  const handleAddExpense = () => {
    navigate('/app/budget/expense_record?mode=create');
  };

  const handleBudgetReport = () => {
    navigate('/app/budget/budget_report');
  };

  // Handle edit navigation
  const handleEditTransaction = (transaction: BudgetTransaction) => {
    if (transaction.category === 'income') {
      navigate(`/app/budget/income_record?mode=edit&id=${transaction.id}`);
    } else if (transaction.category === 'expense') {
      navigate(`/app/budget/expense_record?mode=edit&id=${transaction.id}`);
    }
  };

  // Handle view navigation  
  const handleViewTransaction = (transaction: BudgetTransaction) => {
    if (transaction.category === 'income') {
      navigate(`/app/budget/income_record?id=${transaction.id}`);
    } else if (transaction.category === 'expense') {
      navigate(`/app/budget/expense_record?id=${transaction.id}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">Manage school budget transactions and expenses</p>
        </div>
        <div className="flex gap-2 flex-col md:flex-row">
          {canView && (
            <Button 
              onClick={handleBudgetReport} 
              variant="outline" 
              className="flex items-center"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Budget Report
            </Button>
          )}
          {!isMobile && canView && (
            <Button 
              onClick={exportToExcel} 
              variant="outline" 
              disabled={isExporting}
              className="flex items-center"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          )}
          {canCreate && (
            <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Income
            </Button>
          )}
          {canCreate && (
            <Button onClick={handleAddExpense} className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          )}
          {canUpdate && (
            <Button onClick={handleArchiveAll} variant="outline" className="hidden md:flex">Archive Expenses</Button>
          )}
        </div>
      </div>

      <BudgetSummaryCards transactions={transactions} />

      <BudgetFilters filters={filters} onFiltersChange={setFilters} />

      <div className="rounded-lg border bg-card">
        {isMobile ? (
          <BudgetCards transactions={transactions} onEdit={handleEditTransaction} onView={handleViewTransaction} onDelete={handleDeleteTransaction} />
        ) : (
          <BudgetTable transactions={transactions} isLoading={isLoading} onEdit={handleEditTransaction} onView={handleViewTransaction} onDelete={handleDeleteTransaction} />
        )}
      </div>

      {editingItem && <EditBudgetItemDialog open={!!editingItem} onOpenChange={() => setEditingItem(null)} item={editingItem} onSubmit={updateTransaction} />}

      <DeleteBudgetDialog
        open={!!deletingItem} 
        onOpenChange={() => setDeletingItem(null)} 
        transaction={deletingItem} 
        onConfirm={handleConfirmDelete} 
        loading={false}
      />
    </div>
  );
};
export default BudgetManagementPage;