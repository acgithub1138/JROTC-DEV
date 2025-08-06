import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
const formSchema = z.object({
  school_id: z.string().min(1, 'School is required'),
  status: z.string().default('registered'),
  notes: z.string().optional(),
  new_school_name: z.string().optional(),
  new_school_contact: z.string().optional(),
  new_school_email: z.string().optional()
}).refine((data) => {
  // If "not_listed" is selected, require new_school_name
  if (data.school_id === 'not_listed') {
    return data.new_school_name && data.new_school_name.trim().length > 0;
  }
  return true;
}, {
  message: "School name is required when adding a new school",
  path: ["new_school_name"]
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
  const [schools, setSchools] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);

  const defaultValues: FormData = {
    school_id: '',
    status: 'registered',
    notes: '',
    new_school_name: '',
    new_school_contact: '',
    new_school_email: ''
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

  // Fetch schools when modal opens
  useEffect(() => {
    if (open) {
      fetchSchools();
    }
  }, [open]);

  const fetchSchools = async () => {
    setIsLoadingSchools(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setIsLoadingSchools(false);
    }
  };
  const onSubmit = async (data: FormData) => {
    try {
      let schoolId = data.school_id;
      
      // If "not_listed" is selected, create a new school first
      if (data.school_id === 'not_listed') {
        const { data: newSchool, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: data.new_school_name!,
            contact: data.new_school_contact || null,
            email: data.new_school_email || null,
          })
          .select()
          .single();
          
        if (schoolError) throw schoolError;
        
        schoolId = newSchool.id;
        
        // Refresh the schools list to include the new school
        await fetchSchools();
      }
      
      await onSchoolAdded({
        school_id: schoolId,
        status: data.status,
        notes: data.notes,
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
                  <FormLabel>School</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingSchools}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingSchools ? "Loading schools..." : "Select a school"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="not_listed">Not listed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />
            
            {/* Conditional fields for new school */}
            {form.watch('school_id') === 'not_listed' && (
              <>
                <FormField control={form.control} name="new_school_name" render={({
                  field
                }) => <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                <FormField control={form.control} name="new_school_contact" render={({
                  field
                }) => <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                <FormField control={form.control} name="new_school_email" render={({
                  field
                }) => <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter contact email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </>
            )}
            
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