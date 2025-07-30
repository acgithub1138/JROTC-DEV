import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, CreditCard, FileText, Edit, Tag } from 'lucide-react';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { BudgetTransaction } from '../BudgetManagementPage';
import { format } from 'date-fns';

interface ViewBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BudgetTransaction;
  onEdit?: () => void;
}

export const ViewBudgetItemDialog: React.FC<ViewBudgetItemDialogProps> = ({
  open,
  onOpenChange,
  item,
  onEdit,
}) => {
  const { canEdit: canUpdate } = useTablePermissions('budget');

  const getCategoryBadge = (category: 'income' | 'expense') => {
    const variants = {
      income: 'bg-green-100 text-green-800',
      expense: 'bg-red-100 text-red-800'
    };
    const labels = {
      income: 'Income',
      expense: 'Expense'
    };
    return <Badge className={variants[category]}>
      {labels[category]}
    </Badge>;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      not_paid: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pending',
      paid: 'Paid',
      not_paid: 'Not Paid'
    };
    return <Badge className={variants[status as keyof typeof variants]}>
      {labels[status as keyof typeof labels]}
    </Badge>;
  };

  const getPaymentMethodLabel = (method?: string) => {
    const labels = {
      cash: 'Cash',
      check: 'Check',
      debit_card: 'Debit Card',
      credit_card: 'Credit Card',
      other: 'Other'
    };
    return method ? labels[method as keyof typeof labels] || method : 'Not specified';
  };

  const getTypeLabel = (type: string, category: 'income' | 'expense') => {
    if (category === 'expense') {
      const labels = {
        equipment: 'Equipment',
        travel: 'Travel',
        meals: 'Meals',
        supplies: 'Supplies',
        other: 'Other'
      };
      return labels[type as keyof typeof labels] || type;
    } else {
      const labels = {
        fundraiser: 'Fundraiser',
        donation: 'Donation',
        other: 'Other'
      };
      return labels[type as keyof typeof labels] || type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget Item Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item</label>
                <p className="text-base font-medium">{item.item}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <div className="mt-1">{getCategoryBadge(item.category)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Tag className="w-3 h-3" />
                      {getTypeLabel(item.type, item.category)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-lg font-semibold text-primary">
                    ${Number(item.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-base">{format(new Date(item.date), 'PPP')}</p>
                  </div>
                </div>
              </div>

              {item.budget_year && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Budget Year</label>
                  <p className="text-base">{item.budget_year}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information (for expenses) */}
          {item.category === 'expense' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                    <p className="text-base">{getPaymentMethodLabel(item.payment_method)}</p>
                  </div>
                </div>
                
                {item.status && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {item.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base whitespace-pre-wrap">{item.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {canUpdate && onEdit && (
              <Button onClick={onEdit} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};