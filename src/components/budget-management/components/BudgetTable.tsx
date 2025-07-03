import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  if (isLoading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.item}</TableCell>
                <TableCell>{getCategoryBadge(transaction.category)}</TableCell>
                <TableCell className="capitalize">{transaction.type}</TableCell>
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell className={transaction.category === 'income' ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell className="capitalize">
                  {transaction.payment_method?.replace('_', ' ') || '-'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.status) || '-'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {transaction.description || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(transaction)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};