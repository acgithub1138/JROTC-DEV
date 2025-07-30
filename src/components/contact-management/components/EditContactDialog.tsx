import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '../ContactManagementPage';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['parent', 'relative', 'friend']),
  status: z.enum(['active', 'semi_active', 'not_active']),
  cadet_id: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  onSubmit: (id: string, data: Partial<Contact>) => void;
}

interface Cadet {
  id: string;
  first_name: string;
  last_name: string;
}

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  open,
  onOpenChange,
  contact,
  onSubmit,
}) => {
  const { userProfile } = useAuth();
  const { canEdit: canUpdate } = useTablePermissions('contacts');
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  
  const initialData = {
    name: contact.name,
    type: contact.type,
    status: contact.status,
    cadet_id: contact.cadet_id || 'none',
    phone: contact.phone || '',
    email: contact.email || '',
    notes: contact.notes || '',
  };

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData,
  });

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: form.watch(),
    enabled: open,
  });

  useEffect(() => {
    const fetchCadets = async () => {
      if (!userProfile?.school_id) return;

      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('school_id', userProfile.school_id)
        .eq('role', 'cadet')
        .order('last_name');

      setCadets(data || []);
    };

    if (open) {
      fetchCadets();
      // Reset form with contact data when dialog opens
      form.reset({
        name: contact.name,
        type: contact.type,
        status: contact.status,
        cadet_id: contact.cadet_id || 'none',
        phone: contact.phone || '',
        email: contact.email || '',
        notes: contact.notes || '',
      });
    }
  }, [open, contact, userProfile?.school_id, form]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    resetChanges();
    setShowUnsavedDialog(false);
    setPendingClose(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
  };

  const handleSubmit = (data: ContactFormData) => {
    onSubmit(contact.id, {
      name: data.name,
      type: data.type,
      status: data.status,
      cadet_id: data.cadet_id === 'none' ? null : data.cadet_id || null,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
    });
    resetChanges();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact name" {...field} disabled={!canUpdate} />
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
                            <SelectValue placeholder="Select contact type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="relative">Relative</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="semi_active">Semi-Active</SelectItem>
                          <SelectItem value="not_active">Not Active</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cadet_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Cadet (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                        <FormControl>
                          <SelectTrigger disabled={!canUpdate}>
                            <SelectValue placeholder="Select cadet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No cadet selected</SelectItem>
                          {cadets.map((cadet) => (
                            <SelectItem key={cadet.id} value={cadet.id}>
                              {cadet.last_name}, {cadet.first_name}
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} disabled={!canUpdate} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} disabled={!canUpdate} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes"
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
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canUpdate}>Update Contact</Button>
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