import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useModulePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BudgetTransaction } from '../BudgetManagementPage';

const editSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z.string().optional(),
  status: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BudgetTransaction;
  onSubmit: (id: string, updates: Partial<BudgetTransaction>) => void;
}

export const EditBudgetItemDialog: React.FC<EditBudgetItemDialogProps> = ({
  open,
  onOpenChange,
  item,
  onSubmit,
}) => {
  const { canUpdate } = useModulePermissions('budget');
  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (item && open) {
      form.reset({
        item: item.item,
        type: item.type,
        description: item.description || '',
        date: item.date,
        amount: Number(item.amount),
        payment_method: item.payment_method || '',
        status: item.status || '',
      });
    }
  }, [item, open, form]);

  const handleSubmit = (data: EditFormData) => {
    const updates: Partial<BudgetTransaction> = {
      item: data.item,
      type: data.type,
      description: data.description,
      date: data.date,
      amount: data.amount,
    };

    if (item.category === 'expense') {
      updates.payment_method = data.payment_method as any;
      updates.status = data.status as any;
    }

    onSubmit(item.id, updates);
    onOpenChange(false);
  };

  const getTypeOptions = () => {
    if (item.category === 'expense') {
      return [
        { value: 'equipment', label: 'Equipment' },
        { value: 'travel', label: 'Travel' },
        { value: 'meals', label: 'Meals' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'other', label: 'Other' },
      ];
    } else {
      return [
        { value: 'fundraiser', label: 'Fundraiser' },
        { value: 'donation', label: 'Donation' },
        { value: 'other', label: 'Other' },
      ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {item.category === 'income' ? 'Income' : 'Expense'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} disabled={!canUpdate} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                     <FormControl>
                        <SelectTrigger disabled={!canUpdate}>
                         <SelectValue placeholder="Select type" />
                       </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getTypeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={!canUpdate} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                       disabled={!canUpdate}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {item.category === 'expense' && (
              <>
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                        <FormControl>
                           <SelectTrigger disabled={!canUpdate}>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="debit_card">Debit Card</SelectItem>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                        <FormControl>
                          <SelectTrigger disabled={!canUpdate}>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="not_paid">Not Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      className="resize-none"
                      {...field}
                       disabled={!canUpdate}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canUpdate}>Update</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};