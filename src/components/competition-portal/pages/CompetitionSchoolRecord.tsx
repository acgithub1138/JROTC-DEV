import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { ArrowLeft, Save, Trash2, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { useCompetitionSchoolsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const formSchema = z.object({
  school_id: z.string().min(1, 'School is required'),
  status: z.string().default('registered'),
  notes: z.string().optional(),
  paid: z.boolean().default(false),
  color: z.string().default('#3B82F6'),
  new_school_name: z.string().optional(),
  new_school_initials: z.string().optional(),
  new_school_contact: z.string().optional(),
  new_school_email: z.string().optional()
}).refine(data => {
  if (data.school_id === 'not_listed') {
    return data.new_school_name && data.new_school_name.trim().length > 0;
  }
  return true;
}, {
  message: "School name is required when adding a new school",
  path: ["new_school_name"]
});
type FormData = z.infer<typeof formSchema>;
interface EventOption {
  id: string;
  name: string;
  location?: string;
  fee?: number;
}
export const CompetitionSchoolRecord = () => {
  const navigate = useNavigate();
  const {
    '*': splat
  } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Extract competitionId and schoolId from URL
  const competitionId = splat?.split('/')[2]; // competition-details/{competitionId}/school_record
  const mode = searchParams.get('mode') as 'create' | 'edit' | 'view' || 'create';
  const schoolId = searchParams.get('id');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [schools, setSchools] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [totalFee, setTotalFee] = useState<number>(0);
  console.log('CompetitionSchoolRecord - competitionId:', competitionId);
  console.log('CompetitionSchoolRecord - mode:', mode);
  console.log('CompetitionSchoolRecord - schoolId:', schoolId);
  const permissions = useCompetitionSchoolsPermissions();
  const {
    createSchoolRegistration,
    updateSchoolRegistration,
    deleteSchoolRegistration
  } = useCompetitionSchools(competitionId);
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  // Permission checks
  const canEdit = isCreateMode ? permissions.canCreate : permissions.canUpdate;
  const canDelete = permissions.canDelete && !isCreateMode;
  const defaultValues: FormData = {
    school_id: '',
    status: 'registered',
    notes: '',
    paid: false,
    color: '#3B82F6',
    new_school_name: '',
    new_school_initials: '',
    new_school_contact: '',
    new_school_email: ''
  };
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // Get school registration details for edit mode
  const {
    data: schoolRegistration,
    isLoading: isLoadingSchool
  } = useQuery({
    queryKey: ['school-registration', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const {
        data,
        error
      } = await supabase.from('cp_comp_schools').select('id, school_id, school_name, status, paid, color, notes').eq('id', schoolId).single();
      if (error) throw error;
      return data;
    },
    enabled: (isEditMode || isViewMode) && !!schoolId
  });

  // Get competition details
  const {
    data: competition
  } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: async () => {
      if (!competitionId) return null;
      const {
        data,
        error
      } = await supabase.from('cp_competitions').select('id, name, fee').eq('id', competitionId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId
  });

  // Get available events
  const {
    data: availableEvents
  } = useQuery({
    queryKey: ['competition-events', competitionId],
    queryFn: async () => {
      if (!competitionId) return [];
      const {
        data,
        error
      } = await supabase.from('cp_comp_events').select(`
          id,
          location,
          fee,
          competition_event_types!event (
            id,
            name
          )
        `).eq('competition_id', competitionId);
      if (error) throw error;
      return data.map(event => ({
        id: event.id,
        name: event.competition_event_types?.name || 'Unknown Event',
        location: event.location,
        fee: event.fee || 0
      }));
    },
    enabled: !!competitionId
  });

  // Get current event registrations for edit mode
  const {
    data: currentEventRegistrations
  } = useQuery({
    queryKey: ['school-event-registrations', competitionId, schoolRegistration?.school_id],
    queryFn: async () => {
      if (!schoolRegistration?.school_id || !competitionId) return [];
      const {
        data,
        error
      } = await supabase.from('cp_event_registrations').select('event_id').eq('competition_id', competitionId).eq('school_id', schoolRegistration.school_id);
      if (error) throw error;
      return data.map(reg => reg.event_id);
    },
    enabled: (isEditMode || isViewMode) && !!schoolRegistration?.school_id && !!competitionId
  });
  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData: isCreateMode ? defaultValues : schoolRegistration ? {
      school_id: schoolRegistration.school_id,
      status: schoolRegistration.status || 'registered',
      notes: schoolRegistration.notes || '',
      paid: schoolRegistration.paid || false,
      color: (schoolRegistration as any).color || '#3B82F6',
      new_school_name: '',
      new_school_initials: '',
      new_school_contact: '',
      new_school_email: ''
    } : defaultValues,
    currentData: form.watch(),
    enabled: !isViewMode
  });

  // Fetch schools when component loads or when school registration changes
  useEffect(() => {
    fetchSchools();
  }, [schoolRegistration]);

  // Initialize form data when school data loads
  useEffect(() => {
    if (schoolRegistration && (isEditMode || isViewMode)) {
      const updatedData: FormData = {
        school_id: schoolRegistration.school_id,
        status: schoolRegistration.status || 'registered',
        notes: schoolRegistration.notes || '',
        paid: schoolRegistration.paid || false,
        color: (schoolRegistration as any).color || '#3B82F6',
        new_school_name: '',
        new_school_initials: '',
        new_school_contact: '',
        new_school_email: ''
      };
      form.reset(updatedData);
    }
  }, [schoolRegistration, isEditMode, isViewMode, form]);

  // Initialize selected events
  useEffect(() => {
    if (currentEventRegistrations) {
      setSelectedEvents(new Set(currentEventRegistrations));
    }
  }, [currentEventRegistrations]);

  // Calculate total fee
  useEffect(() => {
    if (availableEvents && competition) {
      const eventFees = Array.from(selectedEvents).reduce((total, eventId) => {
        const event = availableEvents.find(e => e.id === eventId);
        return total + (event?.fee || 0);
      }, 0);
      setTotalFee((competition.fee || 0) + eventFees);
    }
  }, [selectedEvents, availableEvents, competition]);
  const fetchSchools = async () => {
    setIsLoadingSchools(true);
    try {
      // Get schools with jrotc_program filter
      const {
        data: filteredSchools,
        error: filteredError
      } = await supabase.from('schools').select('id, name').not('jrotc_program', 'is', null).order('name');
      if (filteredError) throw filteredError;
      let schoolsList = filteredSchools || [];

      // If we're in edit/view mode and have a school registration, ensure the selected school is included
      if ((isEditMode || isViewMode) && schoolRegistration?.school_id) {
        const selectedSchoolExists = schoolsList.some(s => s.id === schoolRegistration.school_id);
        if (!selectedSchoolExists) {
          // Fetch the selected school separately
          const {
            data: selectedSchool,
            error: selectedError
          } = await supabase.from('schools').select('id, name').eq('id', schoolRegistration.school_id).single();
          if (!selectedError && selectedSchool) {
            schoolsList = [selectedSchool, ...schoolsList].sort((a, b) => a.name.localeCompare(b.name));
          }
        }
      }
      setSchools(schoolsList);

      // Debug log to verify selected school is in the list
      if (schoolRegistration?.school_id) {
        const selectedSchoolInList = schoolsList.find(s => s.id === schoolRegistration.school_id);
        console.log('Selected school in dropdown list:', selectedSchoolInList);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setIsLoadingSchools(false);
    }
  };
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let schoolId = data.school_id;

      // If "not_listed" is selected, create a new school first
      if (data.school_id === 'not_listed') {
        const {
          data: newSchool,
          error: schoolError
        } = await supabase.from('schools').insert({
          name: data.new_school_name!,
          initials: data.new_school_initials || null,
          contact: data.new_school_contact || null,
          email: data.new_school_email || null
        }).select().single();
        if (schoolError) throw schoolError;
        schoolId = newSchool.id;
        await fetchSchools();
      }
      if (isCreateMode) {
        await createSchoolRegistration({
          school_id: schoolId,
          status: data.status,
          notes: data.notes,
          paid: data.paid,
          color: data.color,
          competition_id: competitionId!
        });
        toast.success('School registered successfully');
      } else if (isEditMode && schoolRegistration) {
        // Update school registration
        await updateSchoolRegistration(schoolRegistration.id, {
          status: data.status,
          notes: data.notes,
          paid: data.paid,
          color: data.color,
          total_fee: totalFee
        });

        // Handle event registrations
        const currentEventIds = currentEventRegistrations || [];
        const newEventIds = Array.from(selectedEvents);
        const eventsToRemove = currentEventIds.filter(eventId => !newEventIds.includes(eventId));
        const eventsToAdd = newEventIds.filter(eventId => !currentEventIds.includes(eventId));

        // Remove events
        if (eventsToRemove.length > 0) {
          await supabase.from('cp_event_schedules').delete().eq('competition_id', competitionId).eq('school_id', schoolRegistration.school_id).in('event_id', eventsToRemove);
          await supabase.from('cp_event_registrations').delete().eq('competition_id', competitionId).eq('school_id', schoolRegistration.school_id).in('event_id', eventsToRemove);
        }

        // Add events
        if (eventsToAdd.length > 0) {
          const {
            data: {
              user
            }
          } = await supabase.auth.getUser();
          const eventRegistrations = eventsToAdd.map(eventId => ({
            competition_id: competitionId!,
            school_id: schoolRegistration.school_id,
            event_id: eventId,
            status: 'registered',
            created_by: user?.id
          }));
          await supabase.from('cp_event_registrations').insert(eventRegistrations);
        }
        queryClient.invalidateQueries({
          queryKey: ['competition-schools']
        });
        queryClient.invalidateQueries({
          queryKey: ['school-event-registrations']
        });
        toast.success('School updated successfully');
      }
      resetChanges();
      navigate(`/app/competition-portal/competition-details/${competitionId}/schools`);
    } catch (error) {
      console.error('Error saving school:', error);
      toast.error('Failed to save school registration');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async () => {
    if (!schoolRegistration) return;
    setIsDeleting(true);
    try {
      await deleteSchoolRegistration(schoolRegistration.id);
      toast.success('School registration deleted successfully');
      navigate(`/app/competition-portal/competition-details/${competitionId}/schools`);
    } catch (error) {
      console.error('Error deleting school:', error);
      toast.error('Failed to delete school registration');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  const handleBack = () => {
    if (hasUnsavedChanges && !isViewMode) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/app/competition-portal/competition-details/${competitionId}/schools`);
    }
  };
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate(`/app/competition-portal/competition-details/${competitionId}/schools`);
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  const handleEventToggle = (eventId: string, checked: boolean) => {
    const newSelectedEvents = new Set(selectedEvents);
    if (checked) {
      newSelectedEvents.add(eventId);
    } else {
      newSelectedEvents.delete(eventId);
    }
    setSelectedEvents(newSelectedEvents);
  };
  if (!competitionId) {
    return <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Competition</h1>
          <p className="text-muted-foreground">Competition ID is missing</p>
        </div>
      </div>;
  }
  if ((isEditMode || isViewMode) && schoolId && isLoadingSchool) {
    return <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Loading school details...</h2>
          </div>
        </div>
      </div>;
  }
  if ((isEditMode || isViewMode) && schoolId && !schoolRegistration && !isLoadingSchool) {
    return <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">School Not Found</h1>
          <p className="text-muted-foreground">The requested school registration could not be found</p>
        </div>
      </div>;
  }
  const pageTitle = isCreateMode ? 'Register School' : isEditMode ? 'Edit School Registration' : 'View School Registration';
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-6">
      {/* Back Button - Mobile above, Desktop in header */}
      <div className="md:hidden">
        <Button variant="outline" size="sm" onClick={handleBack} className="flex items-center gap-2 hover:scale-105 transition-transform">
          <ArrowLeft className="h-4 w-4" />
          Back to Schools
        </Button>
      </div>

      {/* Enhanced Header */}
      <div className="p-6 rounded-lg bg-background/60 backdrop-blur-sm border border-primary/20 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack} className="hidden md:flex items-center gap-2 hover:scale-105 transition-transform">
              <ArrowLeft className="h-4 w-4" />
              Back to Schools
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <School className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {pageTitle}
              </h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {canEdit && !isViewMode && <>
                {canDelete && !isCreateMode && <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="flex items-center gap-2 hover:scale-105 transition-transform">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>}
                <Button type="submit" form="school-form" disabled={isSubmitting} className="flex items-center gap-2 hover:scale-105 transition-transform">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Mobile Action Buttons - Above Card */}
        {canEdit && !isViewMode && (
          <div className="md:hidden grid grid-cols-2 gap-2">
            {canDelete && !isCreateMode && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="flex items-center gap-2 hover:scale-105 transition-transform">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <Button type="submit" form="school-form" disabled={isSubmitting} className={`flex items-center gap-2 hover:scale-105 transition-transform ${!canDelete || isCreateMode ? 'col-span-2' : ''}`}>
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}

        <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow bg-background/80 backdrop-blur-sm">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="text-xl font-semibold text-foreground/90">{pageTitle}</CardTitle>
          </CardHeader>
        <CardContent className="pt-6 py-[8px]">
          <Form {...form}>
            <form id="school-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: School and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
                <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-center">
                  <Label className="text-left md:text-right font-semibold">School *</Label>
                  <FormField control={form.control} name="school_id" render={({
                    field
                  }) => <FormItem>
                      {isCreateMode ? <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingSchools || isViewMode}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingSchools ? "Loading schools..." : "Select a school"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-50 bg-background border border-border">
                            {schools.map(school => <SelectItem key={school.id} value={school.id}>
                                {school.name}
                              </SelectItem>)}
                            {isCreateMode && <SelectItem value="not_listed">Not listed</SelectItem>}
                          </SelectContent>
                        </Select> : <>
                          <Input readOnly className="bg-background" value={schoolRegistration?.school_name || schools.find(s => s.id === field.value)?.name || ''} />
                          {/* Keep the school_id in the form state */}
                          <input type="hidden" value={field.value} />
                        </>}
                      <FormMessage />
                    </FormItem>} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-center">
                  <Label className="text-left md:text-right font-semibold">Status</Label>
                  <FormField control={form.control} name="status" render={({
                    field
                  }) => <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isViewMode}>
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
                </div>
              </div>

              {/* New School Fields - Row 2 & 3: School Name/Initials, Contact Person/Email */}
              {form.watch('school_id') === 'not_listed' && isCreateMode && <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-center">
                      <Label className="text-left md:text-right font-semibold">School Name *</Label>
                      <FormField control={form.control} name="new_school_name" render={({
                      field
                    }) => <FormItem>
                            <FormControl>
                              <Input placeholder="Enter school name" {...field} disabled={isViewMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-center">
                      <Label className="text-left md:text-right font-semibold">Initials</Label>
                      <FormField control={form.control} name="new_school_initials" render={({
                      field
                    }) => <FormItem>
                            <FormControl>
                              <Input placeholder="Enter school initials" {...field} disabled={isViewMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-center">
                      <Label className="text-left md:text-right font-semibold">Contact Person</Label>
                      <FormField control={form.control} name="new_school_contact" render={({
                      field
                    }) => <FormItem>
                            <FormControl>
                              <Input placeholder="Enter contact person" {...field} disabled={isViewMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-center">
                      <Label className="text-left md:text-right font-semibold">Email</Label>
                      <FormField control={form.control} name="new_school_email" render={({
                      field
                    }) => <FormItem>
                            <FormControl>
                              <Input type="email" placeholder="Enter contact email" {...field} disabled={isViewMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                    </div>
                  </div>
                </>}

              {/* Payment Status and Color - only for edit mode */}
              {(isEditMode || isViewMode) && <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-primary/5 border border-primary/20 py-[8px]">
                  <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 items-center">
                    <Label className="text-left md:text-right font-semibold">Payment Status</Label>
                    <FormField control={form.control} name="paid" render={({
                    field
                  }) => <FormItem>
                          <div className="flex items-center space-x-2">
                            <Switch id="paid" checked={field.value} onCheckedChange={field.onChange} disabled={isViewMode} />
                            <Label htmlFor="paid">Payment Received</Label>
                          </div>
                        </FormItem>} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-center">
                    <Label className="text-left md:text-right font-semibold">Color</Label>
                    <FormField control={form.control} name="color" render={({
                    field
                  }) => <FormItem>
                          <div className="flex items-center space-x-2">
                            <input type="color" value={field.value} onChange={e => field.onChange(e.target.value)} className="w-10 h-6 p-0 rounded border-0 cursor-pointer" disabled={isViewMode} />
                            <Input type="text" value={field.value} onChange={e => field.onChange(e.target.value)} placeholder="#3B82F6" className="w-32" disabled={isViewMode} />
                          </div>
                        </FormItem>} />
                  </div>
                </div>}

              {/* Event Selection - only for edit/view mode */}
              {(isEditMode || isViewMode) && availableEvents && availableEvents.length > 0 && <div className="space-y-4 p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
                  <Label className="text-base font-semibold">Registered Events</Label>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-4 bg-background/50">
                    {availableEvents.map(event => <div key={event.id} className="flex items-center space-x-3">
                        <Checkbox id={event.id} checked={selectedEvents.has(event.id)} onCheckedChange={checked => handleEventToggle(event.id, checked as boolean)} disabled={isViewMode} />
                        <Label htmlFor={event.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span>
                              {event.name}
                              {event.location && <span className="text-sm text-muted-foreground ml-2">
                                  @ {event.location}
                                </span>}
                            </span>
                            {event.fee && event.fee > 0 && <span className="text-sm font-medium text-primary">
                                ${event.fee}
                              </span>}
                          </div>
                        </Label>
                      </div>)}
                  </div>

                  {/* Total Fee Display */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 py-[8px]">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Fee Breakdown:</Label>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Base Competition Fee:</span>
                          <span>${competition?.fee || 0}</span>
                        </div>
                        {selectedEvents.size > 0 && <div className="flex justify-between">
                            <span>Event Fees ({selectedEvents.size} events):</span>
                            <span>
                              ${availableEvents.filter(event => selectedEvents.has(event.id)).reduce((total, event) => total + (event.fee || 0), 0)}
                            </span>
                          </div>}
                        <div className="flex justify-between font-semibold text-base pt-2 border-t">
                          <span>Total Fee:</span>
                          <span className="text-primary">${totalFee}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>}

              {/* Notes (full width) - moved to bottom */}
              <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-start p-4 rounded-lg bg-secondary/10 border border-secondary/20 py-[8px]">
                <Label className="text-left md:text-right font-semibold pt-2">Notes</Label>
                <FormField control={form.control} name="notes" render={({
                  field
                }) => <FormItem>
                      <FormControl>
                        <Textarea placeholder="Enter any notes" {...field} disabled={isViewMode} className="min-h-[100px] resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>
            </form>
          </Form>
        </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />

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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};