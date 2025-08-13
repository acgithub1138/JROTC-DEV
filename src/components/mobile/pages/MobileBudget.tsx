import React, { useState } from 'react';
import { Plus, Filter, Archive, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BudgetFilters } from '@/components/budget-management/BudgetManagementPage';
import { useBudgetTransactions, useBudgetYears } from '@/components/budget-management/hooks/useBudgetTransactions';
import { formatCurrency } from '@/utils/timeDisplayUtils';
import { AddIncomeDialog } from '@/components/budget-management/components/AddIncomeDialog';
import { AddExpenseDialog } from '@/components/budget-management/components/AddExpenseDialog';
export const MobileBudget: React.FC = () => {
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Remove filters to show all budget data
  const {
    transactions,
    isLoading,
    createTransaction
  } = useBudgetTransactions({
    search: '',
    category: '',
    type: '',
    paymentMethod: '',
    status: '',
    showArchived: false,
    budgetYear: ''
  });
  const {
    data: budgetYears
  } = useBudgetYears();

  // Calculate summary stats
  const totalIncome = transactions.filter(t => t.category === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.category === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const netBalance = totalIncome - totalExpenses;
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getTypeIcon = (category: string) => {
    return category === 'income' ? TrendingUp : TrendingDown;
  };
  const getTypeColor = (category: string) => {
    return category === 'income' ? 'text-green-600' : 'text-red-600';
  };
  const formatTypeDisplay = (type: string) => {
    if (!type) return '';
    // Remove spaces and capitalize first letter
    const formatted = type.replace(/\s+/g, '');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  };
  const formatStatusDisplay = (status: string) => {
    if (!status) return '';
    // Replace underscores with spaces and capitalize each word
    return status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading budget data...</p>
        </div>
      </div>;
  }
  return <div className="p-4 space-y-4">
      {/* Header */}
      

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Income</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Net Balance</span>
                <span className={`font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => setShowAddIncome(true)} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
        <Button onClick={() => setShowAddExpense(true)} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <span className="text-sm text-muted-foreground">
            {transactions.length} items
          </span>
        </div>
        
        {transactions.length === 0 ? <Card>
            <CardContent className="py-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-muted-foreground">No transactions found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first income or expense to get started.
              </p>
            </CardContent>
          </Card> : <div className="space-y-2">
            {transactions.map(transaction => {
          const TypeIcon = getTypeIcon(transaction.category);
          return <Card key={transaction.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${transaction.category === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <TypeIcon className={`h-4 w-4 ${getTypeColor(transaction.category)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{transaction.item}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatTypeDisplay(transaction.type)} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                        {transaction.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {transaction.description}
                          </p>}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`font-semibold text-sm ${getTypeColor(transaction.category)}`}>
                        {transaction.category === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                       <Badge variant="secondary" className={`text-xs ${getStatusColor(transaction.status)}`}>
                         {formatStatusDisplay(transaction.status)}
                       </Badge>
                    </div>
                  </div>
                </Card>;
        })}
          </div>}
      </div>

      {/* Dialogs */}
      <AddIncomeDialog open={showAddIncome} onOpenChange={setShowAddIncome} onSubmit={data => {
      createTransaction(data);
      setShowAddIncome(false);
    }} />

      <AddExpenseDialog open={showAddExpense} onOpenChange={setShowAddExpense} onSubmit={data => {
      createTransaction(data);
      setShowAddExpense(false);
    }} />
    </div>;
};