import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const MobileAddSchool: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId } = useParams<{ competitionId: string }>();
  const { createSchoolRegistration } = useCompetitionSchools(competitionId);
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [schools, setSchools] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    enabled: true
  });

  // Fetch schools when component mounts
  useEffect(() => {
    fetchSchools();
  }, []);

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
      toast.error('Failed to load schools');
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!competitionId) return;
    
    try {
      setIsSubmitting(true);
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
      
      await createSchoolRegistration({
        school_id: schoolId,
        status: data.status,
        notes: data.notes,
        competition_id: competitionId
      });
      
      form.reset();
      resetChanges();
      navigate(`/mobile/competition-portal/manage/${competitionId}/schools`);
    } catch (error) {
      console.error('Error registering school:', error);
      toast.error('Failed to register school');
    } finally {
      setIsSubmitting(false);
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
    form.reset();
    resetChanges();
    setShowUnsavedDialog(false);
    navigate(`/mobile/competition-portal/manage/${competitionId}/schools`);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Register School</h1>
            <p className="text-sm text-muted-foreground">Add a new school to the competition</p>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">School Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="school_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingSchools}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={isLoadingSchools ? "Loading schools..." : "Select a school"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border border-border">
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id} className="hover:bg-accent">
                              {school.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="not_listed" className="hover:bg-accent">Not listed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Conditional fields for new school */}
                {form.watch('school_id') === 'not_listed' && (
                  <>
                    <FormField
                      control={form.control}
                      name="new_school_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter school name" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_school_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact person name" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_school_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter contact email" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
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

                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Registering...' : 'Register School'}
                  </Button>
                </div>
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
    </>
  );
};