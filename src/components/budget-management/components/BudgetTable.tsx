import React, { useState } from 'react';
import { Edit, Trash2, DollarSign, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { StandardTable, StandardTableHeader, StandardTableBody } from '@/components/ui/standard-table';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useTableSettings } from '@/hooks/useTableSettings';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useModulePermissions } from '@/hooks/usePermissions';
import { BudgetTransaction } from '../BudgetManagementPage';

interface BudgetTableProps {
  transactions: BudgetTransaction[];
  isLoading: boolean;
  onEdit: (transaction: BudgetTransaction) => void;
  onDelete: (id: string) => void;
}

export const BudgetTable: React.FC<BudgetTableProps> = ({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const { getPaddingClass } = useTableSettings();
  const { canUpdate, canDelete } = useUserPermissions();
  const { canViewDetails } = useModulePermissions('budget');
  
  const { sortedData: sortedTransactions, sortConfig, handleSort } = useSortableTable({
    data: transactions
  });
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
      setSelectedTransactions(sortedTransactions.map(t => t.id));
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
        onDelete(transactionId);
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
      <StandardTable>
      <StandardTableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedTransactions.length === sortedTransactions.length && sortedTransactions.length > 0}
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
          <TableHead>Actions</TableHead>
        </TableRow>
      </StandardTableHeader>
      <StandardTableBody
        emptyMessage="No transactions found"
        emptyIcon={<DollarSign className="w-12 h-12" />}
        colSpan={10}
      >
        {sortedTransactions.map((transaction) => (
          <TableRow key={transaction.id} className="hover:bg-muted/50">
            <TableCell className={getPaddingClass()}>
              <Checkbox
                checked={selectedTransactions.includes(transaction.id)}
                onCheckedChange={(checked) => handleSelectTransaction(transaction.id, !!checked)}
              />
            </TableCell>
            <TableCell className={`font-medium ${getPaddingClass()}`}>{transaction.item}</TableCell>
            <TableCell className={getPaddingClass()}>{getCategoryBadge(transaction.category)}</TableCell>
            <TableCell className={`capitalize ${getPaddingClass()}`}>{transaction.type}</TableCell>
            <TableCell className={getPaddingClass()}>{formatDate(transaction.date)}</TableCell>
            <TableCell className={`${transaction.category === 'income' ? 'text-green-600' : 'text-red-600'} ${getPaddingClass()}`}>
              {formatCurrency(transaction.amount)}
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
              <div className="flex gap-2">
                {canViewDetails && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(transaction)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View transaction</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {canUpdate('budget') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(transaction)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit transaction</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {canDelete('budget') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(transaction.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete transaction</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </StandardTableBody>
    </StandardTable>
    </TooltipProvider>
  );
};