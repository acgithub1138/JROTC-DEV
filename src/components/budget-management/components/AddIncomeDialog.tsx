import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { BudgetTransaction } from '../BudgetManagementPage';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
const incomeSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  type: z.enum(['fundraiser', 'donation', 'other']),
  description: z.string().optional(),
  date: z.date({
    required_error: 'Date is required'
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0')
});
type IncomeFormData = z.infer<typeof incomeSchema>;
interface AddIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<BudgetTransaction, 'id' | 'created_at' | 'updated_at' | 'school_id' | 'created_by'>) => void;
}
export const AddIncomeDialog: React.FC<AddIncomeDialogProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  const defaultValues = {
    item: '',
    type: 'other' as const,
    description: '',
    date: new Date(),
    amount: 0
  };

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues
  });

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: defaultValues,
    currentData: form.watch(),
    enabled: open
  });
  const handleSubmit = (data: IncomeFormData) => {
    onSubmit({
      item: data.item,
      category: 'income',
      type: data.type,
      description: data.description,
      date: format(data.date, 'yyyy-MM-dd'),
      amount: data.amount,
      archive: false
    });
    form.reset();
    resetChanges();
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(open);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    form.reset();
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Income</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="item" render={({
            field
          }) => <FormItem>
                  <FormLabel>Item *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="type" render={({
            field
          }) => <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select income type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fundraiser">Fundraiser</SelectItem>
                      <SelectItem value="donation">Donation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="date" render={({
            field
          }) => <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} disabled={date => date > new Date() || date < new Date("1900-01-01")} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="amount" render={({
            field
          }) => <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="description" render={({
            field
          }) => <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">Add Income</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog
      open={showUnsavedDialog}
      onOpenChange={setShowUnsavedDialog}
      onDiscard={handleDiscardChanges}
      onCancel={handleContinueEditing}
    />
  </>
  );
};