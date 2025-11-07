
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TablePagination } from '@/components/ui/table-pagination';
import { Edit, Trash2, DollarSign, Calendar, CreditCard, Eye } from 'lucide-react';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI } from '@/utils/timezoneUtils';
import { BudgetTransaction } from '../BudgetManagementPage';
import React from 'react';

// Budget-specific pagination constant
const BUDGET_ITEMS_PER_PAGE = 25;

interface BudgetCardsProps {
  transactions: BudgetTransaction[];
  onEdit: (transaction: BudgetTransaction) => void;
  onView: (transaction: BudgetTransaction) => void;
  onDelete: (transaction: BudgetTransaction) => void;
}

export const BudgetCards = ({
  transactions,
  onEdit,
  onView,
  onDelete,
}) => {
  const { canEdit: canUpdate, canDelete, canViewDetails } = useTablePermissions('budget');
  const { timezone } = useSchoolTimezone();
  const [currentPage, setCurrentPage] = React.useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / BUDGET_ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * BUDGET_ITEMS_PER_PAGE;
  const endIndex = startIndex + BUDGET_ITEMS_PER_PAGE;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'income': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'not_paid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return convertToUI(dateString, timezone, 'date');
  };

  const formatAmount = (amount: number, category: string) => {
    const prefix = category === 'income' ? '+' : '-';
    return `${prefix}$${amount.toFixed(2)}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedTransactions.map((transaction) => (
        <Card key={transaction.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                 {canViewDetails ? (
                   <CardTitle 
                     className="text-lg text-blue-600 hover:text-blue-800 cursor-pointer underline-offset-4 hover:underline"
                     onClick={() => onView(transaction)}
                   >
                     {transaction.item}
                   </CardTitle>
                 ) : (
                   <CardTitle className="text-lg">{transaction.item}</CardTitle>
                 )}
                <p className="text-sm text-muted-foreground capitalize">
                  {transaction.type.replace('_', ' ')}
                </p>
              </div>
              <div className="flex flex-col space-y-1">
                <Badge className={getCategoryColor(transaction.category)}>
                  {transaction.category}
                </Badge>
                {transaction.status && (
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-semibold">
                    {formatAmount(transaction.amount, transaction.category)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{formatDate(transaction.date)}</span>
              </div>

              {transaction.payment_method && (
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm capitalize">
                    {transaction.payment_method.replace('_', ' ')}
                  </span>
                </div>
              )}

              {transaction.description && (
                <div className="text-sm text-gray-600">
                  <p className="line-clamp-2">{transaction.description}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2 sm:flex sm:justify-end sm:space-x-2 sm:gap-0">
              {canUpdate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
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
              {canDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(transaction)}
                      className="text-red-600 hover:text-red-700"
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
          </CardContent>
        </Card>
          ))}
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={transactions.length}
          onPageChange={handlePageChange}
        />
      </div>
    </TooltipProvider>
  );
};