import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useContacts } from './hooks/useContacts';
import { Contact } from './ContactManagementPage';
import { ArrowLeft } from 'lucide-react';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['parent', 'relative', 'friend', 'other']),
  type_other: z.string().optional(),
  status: z.enum(['active', 'semi_active', 'not_active']),
  cadet_id: z.string().min(1),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional()
}).refine(data => {
  if (data.type === 'other') {
    return data.type_other && data.type_other.trim().length > 0;
  }
  return true;
}, {
  message: "Please specify the other type",
  path: ["type_other"]
});

type ContactFormData = z.infer<typeof contactSchema>;
type ContactRecordMode = 'create' | 'edit' | 'view';

interface Cadet {
  id: string;
  first_name: string;
  last_name: string;
}

export const ContactRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const { createContact, updateContact } = useContacts();
  const { canCreate, canEdit, canView } = useTablePermissions('contacts');
  const isMobile = useIsMobile();
  
  // Extract mode and record ID from URL parameters
  const mode = (searchParams.get('mode') as ContactRecordMode) || 'view';
  const contactId = searchParams.get('id');
  
  const [currentMode, setCurrentMode] = useState<ContactRecordMode>(mode);
  const isEditMode = currentMode === 'edit';
  const isViewMode = currentMode === 'view';
  const isCreateMode = currentMode === 'create';
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [isLoading, setIsLoading] = useState(!!contactId);
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

  // Permission checks
  useEffect(() => {
    if (isCreateMode && !canCreate) {
      toast.error("You don't have permission to create contacts");
      navigate('/app/contacts');
      return;
    }
    
    if (isViewMode && !canView) {
      toast.error("You don't have permission to view contacts");
      navigate('/app/contacts');
      return;
    }
    
    if (isEditMode && !canEdit) {
      toast.error("You don't have permission to edit contacts");
      setCurrentMode('view');
      return;
    }
  }, [currentMode, canCreate, canEdit, canView, navigate]);

  // Handle edit mode switch
  const handleEdit = () => {
    if (canEdit && contactId) {
      setCurrentMode('edit');
      navigate(`/app/contacts/contact_record?mode=edit&id=${contactId}`);
    }
  };

  // Initial form data for comparison
  const initialFormData = {
    name: contact?.name || '',
    type: contact?.type || 'parent',
    type_other: contact?.type_other || '',
    status: contact?.status || 'active',
    cadet_id: contact?.cadet_id || 'none',
    phone: contact?.phone || '',
    email: contact?.email || '',
    notes: contact?.notes || ''
  };

  // Get current form values with proper defaults
  const watchedData = form.watch();
  const currentFormData = {
    name: watchedData.name || '',
    type: watchedData.type || 'parent',
    type_other: watchedData.type_other || '',
    status: watchedData.status || 'active',
    cadet_id: watchedData.cadet_id || 'none',
    phone: watchedData.phone || '',
    email: watchedData.email || '',
    notes: watchedData.notes || ''
  };

  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: currentFormData,
    enabled: !isViewMode
  });

  // Load contact data if editing
  useEffect(() => {
    const loadContact = async () => {
      if (!contactId || !userProfile?.school_id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .eq('school_id', userProfile.school_id)
          .single();

        if (error) throw error;
        
        setContact(data);
        form.reset({
          name: data.name,
          type: data.type,
          type_other: data.type_other || '',
          status: data.status,
          cadet_id: data.cadet_id || 'none',
          phone: data.phone || '',
          email: data.email || '',
          notes: data.notes || ''
        });
      } catch (error) {
        console.error('Error loading contact:', error);
        toast.error('Failed to load contact');
        navigate('/app/contacts');
      } finally {
        setIsLoading(false);
      }
    };

    loadContact();
  }, [contactId, userProfile?.school_id, form, navigate]);

  // Load cadets
  useEffect(() => {
    const fetchCadets = async () => {
      if (!userProfile?.school_id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('school_id', userProfile.school_id)
        .eq('active', true)
        .order('last_name');
      
      setCadets(data || []);
    };

    fetchCadets();
  }, [userProfile?.school_id]);

  const handleSubmit = async (data: ContactFormData) => {
    try {
      const contactData = {
        name: data.name,
        type: data.type,
        type_other: data.type === 'other' ? data.type_other || null : null,
        status: data.status,
        cadet_id: data.cadet_id === 'none' ? null : data.cadet_id || null,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null
      };

      if (isEditMode && contact) {
        await updateContact(contact.id, contactData);
      } else {
        await createContact(contactData);
      }
      
      navigate('/app/contacts');
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/app/contacts');
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate('/app/contacts');
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden min-w-0">
      {/* Mobile: Back button above header */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          {/* Desktop: Back button + Title side by side */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Contacts
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">
              {isCreateMode ? 'Add Contact' : isEditMode ? 'Edit Contact' : 'View Contact'}
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              {isCreateMode ? 'Create a new contact record' : isEditMode ? 'Update contact information' : 'Contact details'}
            </p>
          </div>
        </div>

        {/* Mobile: Action buttons below header */}
        {isMobile && (
          <>
            {isViewMode && canEdit && (
              <Button onClick={handleEdit} className="w-full">
                Edit Contact
              </Button>
            )}
            {!isViewMode && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={form.handleSubmit(handleSubmit)}
                  className="flex-1"
                >
                  {isEditMode ? 'Update Contact' : 'Add Contact'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop: View mode edit button */}
      {!isMobile && isViewMode && canEdit && (
        <div className="flex justify-end">
          <Button onClick={handleEdit}>
            Edit Contact
          </Button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
              {/* Row 1: Name - Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                     <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2">
                       <FormLabel className="sm:w-16 sm:text-left sm:shrink-0">Name *</FormLabel>
                       <div className="flex-1 min-w-0">
                         <FormControl>
                           <Input placeholder="Enter contact name" {...field} disabled={isViewMode} />
                         </FormControl>
                         <FormMessage />
                       </div>
                     </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <FormLabel className="sm:w-16 sm:text-left sm:shrink-0">Status *</FormLabel>
                      <div className="flex-1 min-w-0">
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="semi_active">Semi-Active</SelectItem>
                            <SelectItem value="not_active">Not Active</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Phone - Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <FormLabel className="sm:w-16 sm:text-left sm:shrink-0">Phone *</FormLabel>
                      <div className="flex-1 min-w-0">
                         <FormControl>
                           <Input placeholder="Phone number" {...field} disabled={isViewMode} />
                         </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <FormLabel className="sm:w-16 sm:text-left sm:shrink-0">Email</FormLabel>
                      <div className="flex-1 min-w-0">
                         <FormControl>
                           <Input type="email" placeholder="Email address" {...field} disabled={isViewMode} />
                         </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Cadet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <FormField
                  control={form.control}
                  name="cadet_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <FormLabel className="sm:w-16 sm:text-left sm:shrink-0">Cadet</FormLabel>
                      <div className="flex-1 min-w-0">
                         <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cadet" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                            <SelectItem value="none">No cadet selected</SelectItem>
                            {cadets.map(cadet => (
                              <SelectItem key={cadet.id} value={cadet.id}>
                                {cadet.last_name}, {cadet.first_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <div className="hidden sm:block"></div>
              </div>

              {/* Row 4: Type - Other */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <FormLabel className="sm:w-16 sm:text-left sm:shrink-0">Type *</FormLabel>
                      <div className="flex-1 min-w-0">
                         <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="relative">Relative</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('type') === 'other' ? (
                  <FormField
                    control={form.control}
                    name="type_other"
                    render={({ field }) => (
                      <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <FormLabel className="sm:w-16 sm:text-left sm:shrink-0">Other</FormLabel>
                        <div className="flex-1 min-w-0">
                           <FormControl>
                             <Input placeholder="Specify other type" {...field} disabled={isViewMode} />
                           </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="hidden sm:block"></div>
                )}
              </div>


              {/* Notes Field */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <FormLabel className="sm:w-16 sm:text-left sm:shrink-0 sm:pt-2">Notes</FormLabel>
                    <div className="flex-1 min-w-0">
                       <FormControl>
                         <Textarea 
                           placeholder="Additional notes" 
                           className="resize-none min-h-[100px]" 
                           {...field} 
                           disabled={isViewMode}
                         />
                       </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Desktop: Action buttons at bottom */}
              {!isMobile && !isViewMode && (
                <div className="flex justify-end gap-2 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditMode ? 'Update Contact' : 'Add Contact'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </div>
  );
};
