import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatInSchoolTimezone } from '@/utils/timezoneUtils';
import { supabase } from '@/integrations/supabase/client';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
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
interface AddResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onResourceAdded: (resourceData: any) => Promise<any>;
}
export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  onResourceAdded
}) => {
  const {
    users,
    isLoading: usersLoading
  } = useSchoolUsers(true); // Only active users
  const { timezone, isLoading: timezoneLoading } = useSchoolTimezone();
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

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

  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: form.watch(),
    enabled: open
  });

  useEffect(() => {
    if (open) {
      fetchCompetitionDate();
    }
  }, [open]);

  const fetchCompetitionDate = async () => {
    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('start_date, end_date')
        .eq('id', competitionId)
        .single();

      if (error) throw error;

      if (data?.start_date && !timezoneLoading) {
        const startDate = formatInSchoolTimezone(data.start_date, 'yyyy-MM-dd', timezone);
        const endDate = data?.end_date ? formatInSchoolTimezone(data.end_date, 'yyyy-MM-dd', timezone) : startDate;
        
        form.setValue('start_date', startDate);
        form.setValue('end_date', endDate);
      }
    } catch (error) {
      console.error('Error fetching competition date:', error);
    }
  };
  const onSubmit = async (data: FormData) => {
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

      await onResourceAdded({
        resource: data.resource,
        location: data.location,
        assignment_details: data.assignment_details,
        competition_id: competitionId,
        start_time: startTime,
        end_time: endTime
      });
      form.reset();
      handleClose();
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !form.formState.isSubmitting) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleCancelDiscard = () => {
    setShowUnsavedDialog(false);
  };
  return <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Add a new resource assignment for this competition.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="resource" render={({
            field
          }) => <FormItem>
                  <FormLabel>Cadet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={usersLoading ? "Loading users..." : "Select a cadet"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map(user => <SelectItem key={user.id} value={user.id}>
                          {user.last_name}, {user.first_name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />
            <FormField control={form.control} name="location" render={({
            field
          }) => <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
            <div>
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date & Time</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <FormControl>
                        <Input
                          type="date"
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
                    </div>
                    <div>
                      <FormField control={form.control} name="start_time_hour" render={({ field: hourField }) => (
                        <FormControl>
                          <Select value={hourField.value} onValueChange={(value) => {
                            hourField.onChange(value);
                            // Auto-update end time when start time changes (add 1 hour)
                            const startHour = parseInt(value);
                            const startMinute = parseInt(form.getValues('start_time_minute') || '0');
                            let endHour = startHour + 1;
                            let endMinute = startMinute;
                            
                            if (endHour >= 24) {
                              endHour = 0;
                              // If we overflow to the next day, update the end date too
                              const startDate = form.getValues('start_date');
                              if (startDate) {
                                const nextDay = new Date(startDate);
                                nextDay.setDate(nextDay.getDate() + 1);
                                form.setValue('end_date', nextDay.toISOString().split('T')[0]);
                              }
                            } else {
                              // Make sure end date matches start date
                              const startDate = form.getValues('start_date');
                              if (startDate) {
                                form.setValue('end_date', startDate);
                              }
                            }
                            
                            form.setValue('end_time_hour', endHour.toString().padStart(2, '0'));
                            form.setValue('end_time_minute', endMinute.toString().padStart(2, '0'));
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                  {i.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      )} />
                    </div>
                    <div>
                      <FormField control={form.control} name="start_time_minute" render={({ field: minuteField }) => (
                        <FormControl>
                          <Select value={minuteField.value} onValueChange={(value) => {
                            minuteField.onChange(value);
                            // Auto-update end time when start time changes (add 1 hour)
                            const startHour = parseInt(form.getValues('start_time_hour') || '0');
                            const startMinute = parseInt(value);
                            let endHour = startHour + 1;
                            let endMinute = startMinute;
                            
                            if (endHour >= 24) {
                              endHour = 0;
                              // If we overflow to the next day, update the end date too
                              const startDate = form.getValues('start_date');
                              if (startDate) {
                                const nextDay = new Date(startDate);
                                nextDay.setDate(nextDay.getDate() + 1);
                                form.setValue('end_date', nextDay.toISOString().split('T')[0]);
                              }
                            } else {
                              // Make sure end date matches start date
                              const startDate = form.getValues('start_date');
                              if (startDate) {
                                form.setValue('end_date', startDate);
                              }
                            }
                            
                            form.setValue('end_time_hour', endHour.toString().padStart(2, '0'));
                            form.setValue('end_time_minute', endMinute.toString().padStart(2, '0'));
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              {['00', '10', '20', '30', '40', '50'].map((minute) => (
                                <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      )} />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div>
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date & Time</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <div>
                      <FormField control={form.control} name="end_time_hour" render={({ field: hourField }) => (
                        <FormControl>
                          <Select value={hourField.value} onValueChange={hourField.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                  {i.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      )} />
                    </div>
                    <div>
                      <FormField control={form.control} name="end_time_minute" render={({ field: minuteField }) => (
                        <FormControl>
                          <Select value={minuteField.value} onValueChange={minuteField.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              {['00', '10', '20', '30', '40', '50'].map((minute) => (
                                <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      )} />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="assignment_details" render={({
            field
          }) => <FormItem>
                  <FormLabel>Assignment Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter assignment details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
             <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding...' : 'Add Resource'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog
      open={showUnsavedDialog}
      onOpenChange={setShowUnsavedDialog}
      onDiscard={handleDiscardChanges}
      onCancel={handleCancelDiscard}
    />
  </>;
};