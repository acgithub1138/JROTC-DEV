import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '../ContactManagementPage';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['parent', 'relative', 'friend', 'other']),
  type_other: z.string().optional(),
  status: z.enum(['active', 'semi_active', 'not_active']),
  cadet_id: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional()
}).refine((data) => {
  if (data.type === 'other') {
    return data.type_other && data.type_other.trim().length > 0;
  }
  return true;
}, {
  message: "Please specify the other type",
  path: ["type_other"],
});
type ContactFormData = z.infer<typeof contactSchema>;
interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'school_id' | 'created_by'>) => void;
}
interface Cadet {
  id: string;
  first_name: string;
  last_name: string;
}
export const AddContactDialog: React.FC<AddContactDialogProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const {
    userProfile
  } = useAuth();
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      type: 'parent',
      type_other: '',
      status: 'active',
      cadet_id: 'none',
      phone: '',
      email: '',
      notes: ''
    }
  });

  // Initial form data for comparison
  const initialFormData = {
    name: '',
    type: 'parent' as const,
    type_other: '',
    status: 'active' as const,
    cadet_id: 'none',
    phone: '',
    email: '',
    notes: ''
  };

  // Get current form values with proper defaults
  const watchedData = form.watch();
  const currentFormData = {
    name: watchedData.name || '',
    type: watchedData.type || 'parent' as const,
    type_other: watchedData.type_other || '',
    status: watchedData.status || 'active' as const,
    cadet_id: watchedData.cadet_id || 'none',
    phone: watchedData.phone || '',
    email: watchedData.email || '',
    notes: watchedData.notes || ''
  };
  const {
    hasUnsavedChanges
  } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: currentFormData,
    enabled: open
  });
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(newOpen);
    }
  };
  const handleDiscardChanges = () => {
    form.reset();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  useEffect(() => {
    const fetchCadets = async () => {
      if (!userProfile?.school_id) return;
      const {
        data
      } = await supabase.from('profiles').select('id, first_name, last_name').eq('school_id', userProfile.school_id).eq('role', 'cadet').eq('active', true).order('last_name');
      setCadets(data || []);
    };
    if (open) {
      fetchCadets();
    }
  }, [open, userProfile?.school_id]);
  const handleSubmit = (data: ContactFormData) => {
    onSubmit({
      name: data.name,
      type: data.type,
      type_other: data.type === 'other' ? data.type_other || null : null,
      status: data.status,
      cadet_id: data.cadet_id === 'none' ? null : data.cadet_id || null,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null
    });
    form.reset();
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({
              field
            }) => <FormItem className="col-span-2">
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="type" render={({
              field
            }) => <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="relative">Relative</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              {form.watch('type') === 'other' && (
                <FormField control={form.control} name="type_other" render={({
                field
              }) => <FormItem>
                      <FormLabel>Other</FormLabel>
                      <FormControl>
                        <Input placeholder="Specify other type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="semi_active">Semi-Active</SelectItem>
                        <SelectItem value="not_active">Not Active</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="cadet_id" render={({
              field
            }) => <FormItem className="col-span-2">
                    <FormLabel>Cadet (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cadet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No cadet selected</SelectItem>
                        {cadets.map(cadet => <SelectItem key={cadet.id} value={cadet.id}>
                            {cadet.last_name}, {cadet.first_name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="phone" render={({
              field
            }) => <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

            </div>

            <FormField control={form.control} name="notes" render={({
            field
          }) => <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Contact</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      
      <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />
    </Dialog>;
};