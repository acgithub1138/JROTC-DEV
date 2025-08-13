import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { toast } from 'sonner';

const formSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
  paid: z.boolean(),
  color: z.string().optional(),
  total_fee: z.coerce.number().optional()
});

type FormData = z.infer<typeof formSchema>;

export const MobileEditSchool: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId, schoolId } = useParams<{ competitionId: string; schoolId: string }>();
  const { schools, updateSchoolRegistration, deleteSchoolRegistration } = useCompetitionSchools(competitionId);
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Find the school data
  const school = schools.find(s => s.id === schoolId);

  const defaultValues: FormData = {
    status: school?.status || 'registered',
    notes: school?.notes || '',
    paid: school?.paid || false,
    color: school?.color || '#3B82F6',
    total_fee: school?.total_fee || 0
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
    enabled: true
  });

  // Reset form when school data loads
  useEffect(() => {
    if (school) {
      const newValues = {
        status: school.status || 'registered',
        notes: school.notes || '',
        paid: school.paid || false,
        color: school.color || '#3B82F6',
        total_fee: school.total_fee || 0
      };
      form.reset(newValues);
      resetChanges();
    }
  }, [school, form, resetChanges]);

  const onSubmit = async (data: FormData) => {
    if (!schoolId) return;
    
    try {
      setIsSubmitting(true);
      await updateSchoolRegistration(schoolId, data);
      form.reset(data);
      resetChanges();
      navigate(`/mobile/competition-portal/manage/${competitionId}/schools`);
    } catch (error) {
      console.error('Error updating school registration:', error);
      toast.error('Failed to update school registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!schoolId) return;
    
    try {
      setIsDeleting(true);
      await deleteSchoolRegistration(schoolId);
      setShowDeleteDialog(false);
      navigate(`/mobile/competition-portal/manage/${competitionId}/schools`);
    } catch (error) {
      console.error('Error deleting school registration:', error);
      toast.error('Failed to delete school registration');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/mobile/competition-portal/manage/${competitionId}/schools`);
    }
  };

  const handleDiscardChanges = () => {
    form.reset(defaultValues);
    resetChanges();
    setShowUnsavedDialog(false);
    navigate(`/mobile/competition-portal/manage/${competitionId}/schools`);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  if (!school) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/schools`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">School Not Found</h1>
        </div>
        <p className="text-muted-foreground">The requested school registration could not be found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center flex-1 min-w-0">
            <button
              onClick={handleBack}
              className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-muted-foreground" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground truncate">Edit School</h1>
              <p className="text-sm text-muted-foreground truncate">{school.school_name || 'Unnamed School'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Save size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 w-8 p-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">School Registration Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border border-border">
                          <SelectItem value="registered" className="hover:bg-accent">Registered</SelectItem>
                          <SelectItem value="confirmed" className="hover:bg-accent">Confirmed</SelectItem>
                          <SelectItem value="cancelled" className="hover:bg-accent">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Status</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value ? 'true' : 'false'}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border border-border">
                            <SelectItem value="false" className="hover:bg-accent">Unpaid</SelectItem>
                            <SelectItem value="true" className="hover:bg-accent">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="total_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Fee ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            className="bg-background" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Color</FormLabel>
                      <div className="flex items-center space-x-3">
                        <FormControl>
                          <Input 
                            type="color" 
                            className="w-12 h-10 rounded border bg-background p-1" 
                            {...field} 
                          />
                        </FormControl>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="#3B82F6" 
                            className="bg-background flex-1" 
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter any notes" className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete School Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this school registration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};