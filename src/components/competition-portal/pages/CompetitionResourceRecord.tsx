import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { formatInSchoolTimezone } from '@/utils/timezoneUtils';
import { supabase } from '@/integrations/supabase/client';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  location: z.string().optional(),
  start_date: z.string().optional(),
  start_time_hour: z.string().optional(),
  start_time_minute: z.string().optional(),
  end_date: z.string().optional(),
  end_time_hour: z.string().optional(),
  end_time_minute: z.string().optional(),
  assignment_details: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export const CompetitionResourceRecord: React.FC = () => {
  const { '*': splat } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resourceId = searchParams.get('id');
  const mode = searchParams.get('mode') as 'create' | 'edit' | 'view';
  
  // Extract competitionId from the splat parameter
  const competitionId = splat?.split('/')[2]; // competition-details/{competitionId}/resources_record
  
  // Debug logs
  console.log('CompetitionResourceRecord - splat:', splat);
  console.log('CompetitionResourceRecord - competitionId:', competitionId);
  console.log('CompetitionResourceRecord - resourceId:', resourceId);
  console.log('CompetitionResourceRecord - mode:', mode);
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userProfile } = useAuth();
  const { canCreate, canEdit, canDelete, canView } = useTablePermissions('cp_comp_resources');
  const { users, isLoading: usersLoading } = useSchoolUsers(true);
  const { timezone, isLoading: timezoneLoading } = useSchoolTimezone();
  const { resources, createResource, updateResource, deleteResource, isLoading: resourcesLoading } = useCompetitionResources(competitionId);

  const existingResource = resourceId ? resources.find(r => r.id === resourceId) : null;
  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';

  const initialFormData = {
    resource: '',
    location: '',
    start_date: '',
    start_time_hour: '09',
    start_time_minute: '00',
    end_date: '',
    end_time_hour: '10',
    end_time_minute: '00',
    assignment_details: ''
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormData
  });

  const [currentInitialData, setCurrentInitialData] = useState<FormData>(initialFormData);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: currentInitialData,
    currentData: form.watch(),
    enabled: !isViewMode
  });

  // Load existing resource data when available
  useEffect(() => {
    if (existingResource && (isEditMode || isViewMode)) {
      const startDate = existingResource.start_time ? formatInSchoolTimezone(existingResource.start_time, 'yyyy-MM-dd', timezone) : '';
      const startHour = existingResource.start_time ? formatInSchoolTimezone(existingResource.start_time, 'HH', timezone) : '09';
      const startMinute = existingResource.start_time ? formatInSchoolTimezone(existingResource.start_time, 'mm', timezone) : '00';
      const endDate = existingResource.end_time ? formatInSchoolTimezone(existingResource.end_time, 'yyyy-MM-dd', timezone) : '';
      const endHour = existingResource.end_time ? formatInSchoolTimezone(existingResource.end_time, 'HH', timezone) : '10';
      const endMinute = existingResource.end_time ? formatInSchoolTimezone(existingResource.end_time, 'mm', timezone) : '00';
      
      const updatedData: FormData = {
        resource: existingResource.resource || '',
        location: existingResource.location || '',
        start_date: startDate,
        start_time_hour: startHour,
        start_time_minute: startMinute,
        end_date: endDate,
        end_time_hour: endHour,
        end_time_minute: endMinute,
        assignment_details: existingResource.assignment_details || ''
      };
      
      form.reset(updatedData);
      setCurrentInitialData(updatedData);
    }
  }, [existingResource, isEditMode, isViewMode, form, timezone]);

  // Load competition dates for create mode
  useEffect(() => {
    if (isCreateMode && competitionId && !timezoneLoading) {
      fetchCompetitionDate();
    }
  }, [isCreateMode, competitionId, timezoneLoading]);

  const fetchCompetitionDate = async () => {
    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('start_date, end_date')
        .eq('id', competitionId)
        .single();

      if (error) throw error;

      if (data?.start_date) {
        const startDate = formatInSchoolTimezone(data.start_date, 'yyyy-MM-dd', timezone);
        const endDate = data?.end_date ? formatInSchoolTimezone(data.end_date, 'yyyy-MM-dd', timezone) : startDate;
        
        form.setValue('start_date', startDate);
        form.setValue('end_date', endDate);
      }
    } catch (error) {
      console.error('Error fetching competition date:', error);
    }
  };

  const handleSubmit = async (data: FormData) => {
    if (!competitionId) return;

    setIsSubmitting(true);
    try {
      let startTime = null;
      let endTime = null;

      // Build start time if date and time are provided
      if (data.start_date && data.start_time_hour && data.start_time_minute) {
        const startDateTime = new Date(`${data.start_date}T${data.start_time_hour}:${data.start_time_minute}:00`);
        startTime = startDateTime.toISOString();
      }

      // Build end time if date and time are provided
      if (data.end_date && data.end_time_hour && data.end_time_minute) {
        const endDateTime = new Date(`${data.end_date}T${data.end_time_hour}:${data.end_time_minute}:00`);
        endTime = endDateTime.toISOString();
      }

      const resourceData = {
        resource: data.resource,
        location: data.location,
        assignment_details: data.assignment_details,
        competition_id: competitionId,
        school_id: userProfile?.school_id || '',
        start_time: startTime,
        end_time: endTime
      };

      if (isCreateMode) {
        await createResource(resourceData);
        toast.success('Resource added successfully');
      } else if (isEditMode && resourceId) {
        await updateResource(resourceId, resourceData);
        toast.success('Resource updated successfully');
      }

      resetChanges();
      navigate(`/app/competition-portal/competition-details/${competitionId}?tab=resources`);
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!resourceId) return;

    try {
      await deleteResource(resourceId);
      toast.success('Resource deleted successfully');
      navigate(`/app/competition-portal/competition-details/${competitionId}?tab=resources`);
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/app/competition-portal/competition-details/${competitionId}?tab=resources`);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate(`/app/competition-portal/competition-details/${competitionId}?tab=resources`);
  };

  const handleCancelDiscard = () => {
    setShowUnsavedDialog(false);
  };

  // Show loading state
  if ((isEditMode || isViewMode) && resourceId && !existingResource && !resourcesLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Resource not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((isEditMode || isViewMode) && resourcesLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = isCreateMode ? 'Add Resource' : isEditMode ? 'Edit Resource' : 'View Resource';
  const canEditResource = isCreateMode ? canCreate : canEdit;

  return (
    <>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Resources
                </Button>
                <CardTitle>{pageTitle}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {!isViewMode && canEditResource && (
                  <>
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Cancel
                    </Button>
                    {(isEditMode || isViewMode) && canDelete && (
                      <Button 
                        variant="destructive" 
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      form="resource-form" 
                      disabled={isSubmitting}
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? 'Saving...' : isCreateMode ? 'Add Resource' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form 
                id="resource-form" 
                onSubmit={form.handleSubmit(handleSubmit)} 
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                  <Label htmlFor="resource" className="text-right">Cadet *</Label>
                  <FormField
                    control={form.control}
                    name="resource"
                    render={({ field }) => (
                      <FormItem>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isViewMode || usersLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue 
                                placeholder={usersLoading ? "Loading users..." : "Select a cadet"} 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users
                              .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name))
                              .map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.last_name}, {user.first_name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                  <Label htmlFor="location" className="text-right">Location</Label>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            id="location"
                            placeholder="Enter location" 
                            disabled={isViewMode}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
                  <Label className="text-right pt-2">Start Date & Time</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="date"
                                disabled={isViewMode}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-set end date when start date changes
                                  if (e.target.value && !form.getValues('end_date')) {
                                    form.setValue('end_date', e.target.value);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="start_time_hour"
                        render={({ field }) => (
                          <FormItem>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                              disabled={isViewMode}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="start_time_minute"
                        render={({ field }) => (
                          <FormItem>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                              disabled={isViewMode}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['00', '10', '20', '30', '40', '50'].map((minute) => (
                                  <SelectItem key={minute} value={minute}>
                                    {minute}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
                  <Label className="text-right pt-2">End Date & Time</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="date"
                                disabled={isViewMode}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="end_time_hour"
                        render={({ field }) => (
                          <FormItem>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                              disabled={isViewMode}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="end_time_minute"
                        render={({ field }) => (
                          <FormItem>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                              disabled={isViewMode}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['00', '10', '20', '30', '40', '50'].map((minute) => (
                                  <SelectItem key={minute} value={minute}>
                                    {minute}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
                  <Label htmlFor="assignment_details" className="text-right pt-2">Assignment Details</Label>
                  <FormField
                    control={form.control}
                    name="assignment_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            id="assignment_details"
                            placeholder="Enter assignment details" 
                            disabled={isViewMode}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
        onCancel={handleCancelDiscard}
      />

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Delete Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Are you sure you want to delete this resource assignment? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setShowDeleteDialog(false);
                    handleDelete();
                  }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};