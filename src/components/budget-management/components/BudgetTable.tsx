import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { StandardTable, StandardTableHeader, StandardTableBody } from '@/components/ui/standard-table';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { TablePagination } from '@/components/ui/table-pagination';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useTableSettings } from '@/hooks/useTableSettings';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { format as formatDate } from 'date-fns';
import { formatCurrency as formatCurrencyUtil } from '@/utils/timeDisplayUtils';
import { BudgetTransaction } from '../BudgetManagementPage';

// Budget-specific pagination constant
const BUDGET_ITEMS_PER_PAGE = 25;

interface BudgetTableProps {
  transactions: BudgetTransaction[];
  isLoading: boolean;
  onEdit: (transaction: BudgetTransaction) => void;
  onView: (transaction: BudgetTransaction) => void;
  onDelete: (transaction: BudgetTransaction) => void;
}

export const BudgetTable: React.FC<BudgetTableProps> = ({
  transactions,
  isLoading,
  onEdit,
  onView,
  onDelete,
}) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { getPaddingClass } = useTableSettings();
  const { canEdit: canUpdate, canDelete, canViewDetails } = useTablePermissions('budget');
  
  const { sortedData: sortedTransactions, sortConfig, handleSort } = useSortableTable({
    data: transactions
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedTransactions.length / BUDGET_ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * BUDGET_ITEMS_PER_PAGE;
  const endIndex = startIndex + BUDGET_ITEMS_PER_PAGE;
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Format date from YYYY-MM-DD to MM/DD/YYYY (no timezone conversion needed for date-only fields)
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const getCategoryBadge = (category: string) => {
    return category === 'income' ? (
      <Badge className="bg-green-100 text-green-800">Income</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Expense</Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      not_paid: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(paginatedTransactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, transactionId]);
    } else {
      setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedTransactions.length} transaction${selectedTransactions.length > 1 ? 's' : ''}?`;
    if (confirm(confirmMessage)) {
      selectedTransactions.forEach(transactionId => {
        const transaction = paginatedTransactions.find(t => t.id === transactionId);
        if (transaction) {
          onDelete(transaction);
        }
      });
      setSelectedTransactions([]);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <StandardTable>
        <StandardTableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
          <SortableTableHead sortKey="item" currentSort={sortConfig} onSort={handleSort}>
            Item
          </SortableTableHead>
          <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={handleSort}>
            Category
          </SortableTableHead>
          <SortableTableHead sortKey="type" currentSort={sortConfig} onSort={handleSort}>
            Type
          </SortableTableHead>
          <SortableTableHead sortKey="date" currentSort={sortConfig} onSort={handleSort}>
            Date
          </SortableTableHead>
          <SortableTableHead sortKey="amount" currentSort={sortConfig} onSort={handleSort}>
            Amount
          </SortableTableHead>
          <SortableTableHead sortKey="payment_method" currentSort={sortConfig} onSort={handleSort}>
            Payment Method
          </SortableTableHead>
          <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>
            Status
          </SortableTableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </StandardTableHeader>
      <StandardTableBody
        emptyMessage="No transactions found"
        emptyIcon={<DollarSign className="w-12 h-12" />}
        colSpan={10}
      >
        {paginatedTransactions.map((transaction) => (
          <TableRow key={transaction.id} className="hover:bg-muted/50">
            <TableCell className={getPaddingClass()}>
              <Checkbox
                checked={selectedTransactions.includes(transaction.id)}
                onCheckedChange={(checked) => handleSelectTransaction(transaction.id, !!checked)}
              />
            </TableCell>
            <TableCell className={`font-medium ${getPaddingClass()}`}>
                      {canViewDetails ? (
                        <button
                          onClick={() => onView(transaction)}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer underline-offset-4 hover:underline text-left font-medium"
                        >
                          {transaction.item}
                        </button>
                      ) : (
                        transaction.item
                      )}
            </TableCell>
            <TableCell className={getPaddingClass()}>{getCategoryBadge(transaction.category)}</TableCell>
            <TableCell className={`capitalize ${getPaddingClass()}`}>{transaction.type}</TableCell>
            <TableCell className={getPaddingClass()}>{formatDateDisplay(transaction.date)}</TableCell>
            <TableCell className={`${transaction.category === 'income' ? 'text-green-600' : 'text-red-600'} ${getPaddingClass()}`}>
              {formatCurrencyUtil(transaction.amount)}
            </TableCell>
            <TableCell className={`capitalize ${getPaddingClass()}`}>
              {transaction.payment_method?.replace('_', ' ') || '-'}
            </TableCell>
            <TableCell className={getPaddingClass()}>
              {getStatusBadge(transaction.status) || '-'}
            </TableCell>
            <TableCell className={`max-w-xs truncate ${getPaddingClass()}`}>
              {transaction.description || '-'}
            </TableCell>
            <TableCell className={getPaddingClass()}>
              <TableActionButtons
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={() => onEdit(transaction)}
                onDelete={() => onDelete(transaction)}
              />
            </TableCell>
          </TableRow>
        ))}
      </StandardTableBody>
    </StandardTable>

    <TablePagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={sortedTransactions.length}
      onPageChange={handlePageChange}
    />
    </div>
    </TooltipProvider>
  );
};