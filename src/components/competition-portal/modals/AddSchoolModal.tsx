import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
const formSchema = z.object({
  school_id: z.string().min(1, 'School ID is required'),
  status: z.string().default('registered'),
  notes: z.string().optional()
});
type FormData = z.infer<typeof formSchema>;
interface AddSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onSchoolAdded: (schoolData: any) => Promise<any>;
}
export const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  onSchoolAdded
}) => {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const defaultValues = {
    school_id: '',
    status: 'registered' as const,
    notes: ''
  };
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData: defaultValues,
    currentData: form.watch(),
    enabled: open
  });
  const onSubmit = async (data: FormData) => {
    try {
      await onSchoolAdded({
        ...data,
        competition_id: competitionId
      });
      form.reset();
      resetChanges();
      onOpenChange(false);
    } catch (error) {
      console.error('Error registering school:', error);
    }
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
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register School</DialogTitle>
          <DialogDescription>
            Register a new school for this competition.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="school_id" render={({
              field
            }) => <FormItem>
                  <FormLabel>School ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter school ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="status" render={({
              field
            }) => <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="notes" render={({
              field
            }) => <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Registering...' : 'Register School'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />
  </>;
};