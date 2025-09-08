import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useToast } from '@/hooks/use-toast';
import { BudgetTransaction } from '../BudgetManagementPage';
const editSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  date: z.date({
    required_error: 'Date is required'
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z.string().optional(),
  status: z.string().optional()
});
type EditFormData = z.infer<typeof editSchema>;
interface EditBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BudgetTransaction;
  onSubmit: (id: string, updates: Partial<BudgetTransaction>) => void;
  viewOnly?: boolean;
  onSwitchToEdit?: () => void;
}
export const EditBudgetItemDialog: React.FC<EditBudgetItemDialogProps> = ({
  open,
  onOpenChange,
  item,
  onSubmit,
  viewOnly = false,
  onSwitchToEdit
}) => {
  const {
    canEdit: canUpdate
  } = useTablePermissions('budget');
  const isReadOnly = viewOnly || !canUpdate;
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const { toast } = useToast(); // Add toast hook
  const [initialFormData, setInitialFormData] = useState<EditFormData>({
    item: '',
    type: '',
    description: '',
    date: new Date(),
    amount: 0,
    payment_method: '',
    status: ''
  });
  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema)
  });
  const formData = form.watch();
  const {
    hasUnsavedChanges
  } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: !isReadOnly
  });
  useEffect(() => {
    if (item && open) {
      const formData = {
        item: item.item,
        type: item.type,
        description: item.description || '',
        date: new Date(item.date),
        amount: Number(item.amount),
        payment_method: item.payment_method || '',
        status: item.status || ''
      };
      form.reset(formData);
      setInitialFormData(formData);
    }
  }, [item, open, form]);
  const handleSubmit = (data: EditFormData) => {
    console.log('🔍 EditBudgetItemDialog.handleSubmit called via UPDATE BUTTON');
    const updates: Partial<BudgetTransaction> = {
      item: data.item,
      type: data.type,
      description: data.description,
      date: format(data.date, 'yyyy-MM-dd'),
      amount: data.amount
    };
    if (item.category === 'expense') {
      updates.payment_method = data.payment_method as any;
      updates.status = data.status as any;
    }
    
    console.log('🔍 About to call onSubmit (updateTransaction from hook)');
    onSubmit(item.id, updates);
    
    // Show toast message for dialog updates
    toast({
      title: item.category === 'expense' ? "Expense Updated" : "Income Updated", 
      description: `${item.category === 'expense' ? 'Expense' : 'Income'} record has been updated successfully.`
    });
    
    console.log('🔍 Closing dialog, NO navigation from EditBudgetItemDialog');
    onOpenChange(false);
  };
  const getTypeOptions = () => {
    if (item.category === 'expense') {
      return [{
        value: 'equipment',
        label: 'Equipment'
      }, {
        value: 'travel',
        label: 'Travel'
      }, {
        value: 'meals',
        label: 'Meals'
      }, {
        value: 'supplies',
        label: 'Supplies'
      }, {
        value: 'other',
        label: 'Other'
      }];
    } else {
      return [{
        value: 'fundraiser',
        label: 'Fundraiser'
      }, {
        value: 'donation',
        label: 'Donation'
      }, {
        value: 'other',
        label: 'Other'
      }];
    }
  };
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges && !isReadOnly) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(newOpen);
  };
  const handleCancel = () => {
    if (hasUnsavedChanges && !isReadOnly) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewOnly ? 'View' : 'Edit'} {item.category === 'income' ? 'Income' : 'Expense'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="item" render={({
              field
            }) => <FormItem>
                  <FormLabel>Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} disabled={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="type" render={({
              field
            }) => <FormItem>
                  <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                     <FormControl>
                        <SelectTrigger disabled={isReadOnly}>
                         <SelectValue placeholder="Select type" />
                       </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getTypeOptions().map(option => <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="date" render={({
              field
            }) => <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isReadOnly}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => isReadOnly || date > new Date() || date < new Date("1900-01-01")} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="amount" render={({
              field
            }) => <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {item.category === 'expense' && <>
                <FormField control={form.control} name="payment_method" render={({
                field
              }) => <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                           <SelectTrigger disabled={isReadOnly}>
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
                    </FormItem>} />

                <FormField control={form.control} name="status" render={({
                field
              }) => <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger disabled={isReadOnly}>
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
                    </FormItem>} />
              </>}

            <FormField control={form.control} name="description" render={({
              field
            }) => <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" className="resize-none" {...field} disabled={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                {viewOnly ? 'Close' : 'Cancel'}
              </Button>
              {viewOnly && canUpdate && onSwitchToEdit && <Button onClick={onSwitchToEdit}>
                  Edit
                </Button>}
              {!viewOnly && <Button type="submit" disabled={!canUpdate}>Update</Button>}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />
    </>;
};