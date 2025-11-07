import React, { useState } from 'react';
import { Plus, FileDown, BarChart3, Archive, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
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
  
  const handleArchiveAll = () => {
    setShowArchiveDialog(true);
  };

  const handleConfirmArchive = async () => {
    const currentYear = new Date().getFullYear();
    const budgetYear = `${currentYear - 1} - ${currentYear}`;
    await archiveAllTransactions(budgetYear);
    setShowArchiveDialog(false);
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
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Budget Management</h1>
            <p className="text-muted-foreground">Manage school budget transactions and expenses</p>
          </div>
          
          {/* Desktop buttons */}
          <div className="hidden md:flex gap-2">
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
            
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-background border shadow-md z-50" align="end">
                {canView && (
                  <DropdownMenuItem onClick={handleBudgetReport} className="flex items-center cursor-pointer">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Budget Report
                  </DropdownMenuItem>
                )}
                {!isMobile && canView && (
                  <DropdownMenuItem 
                    onClick={exportToExcel} 
                    disabled={isExporting}
                    className="flex items-center cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export to Excel'}
                  </DropdownMenuItem>
                )}
                {canUpdate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleArchiveAll} className="flex items-center cursor-pointer">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Expenses
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile buttons - 3 column grid below header */}
        <div className="grid grid-cols-3 gap-2 md:hidden">
          {canCreate && (
            <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700 text-white w-full" size="lg">
              <Plus className="w-5 h-5" />
            </Button>
          )}
          {canCreate && (
            <Button onClick={handleAddExpense} className="bg-red-600 hover:bg-red-700 text-white w-full" size="lg">
              <Plus className="w-5 h-5" />
            </Button>
          )}
          
          {/* Actions Dropdown - Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full" size="lg">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-background border shadow-md z-50" align="end">
              {canView && (
                <DropdownMenuItem onClick={handleBudgetReport} className="flex items-center cursor-pointer">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Budget Report
                </DropdownMenuItem>
              )}
              {!isMobile && canView && (
                <DropdownMenuItem 
                  onClick={exportToExcel} 
                  disabled={isExporting}
                  className="flex items-center cursor-pointer"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export to Excel'}
                </DropdownMenuItem>
              )}
              {canUpdate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleArchiveAll} className="flex items-center cursor-pointer">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Expenses
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Expenses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive all expenses from the previous budget year? This will move all transactions to the archive and they will no longer appear in the active budget view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive}>
              Archive All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default BudgetManagementPage;