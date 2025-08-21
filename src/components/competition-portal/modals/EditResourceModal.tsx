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
import { format } from 'date-fns';
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
interface Resource {
  id: string;
  resource: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  assignment_details?: string;
  cadet_profile?: {
    first_name: string;
    last_name: string;
  };
}
interface EditResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
  onResourceUpdated: (id: string, resourceData: any) => Promise<any>;
}
export const EditResourceModal: React.FC<EditResourceModalProps> = ({
  open,
  onOpenChange,
  resource,
  onResourceUpdated
}) => {
  const {
    users,
    isLoading: usersLoading
  } = useSchoolUsers(true);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [initialFormData, setInitialFormData] = useState({
    resource: '',
    location: '',
    start_date: '',
    start_time_hour: '09',
    start_time_minute: '00',
    end_date: '',
    end_time_hour: '10',
    end_time_minute: '00',
    assignment_details: ''
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormData
  });

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: form.watch(),
    enabled: open
  });

  // Populate form when resource changes
  useEffect(() => {
    if (resource && open) {
      const startDate = resource.start_time ? format(new Date(resource.start_time), 'yyyy-MM-dd') : '';
      const startHour = resource.start_time ? format(new Date(resource.start_time), 'HH') : '09';
      const startMinute = resource.start_time ? format(new Date(resource.start_time), 'mm') : '00';
      const endDate = resource.end_time ? format(new Date(resource.end_time), 'yyyy-MM-dd') : '';
      const endHour = resource.end_time ? format(new Date(resource.end_time), 'HH') : '10';
      const endMinute = resource.end_time ? format(new Date(resource.end_time), 'mm') : '00';
      
      const newFormData = {
        resource: resource.resource || '',
        location: resource.location || '',
        start_date: startDate,
        start_time_hour: startHour,
        start_time_minute: startMinute,
        end_date: endDate,
        end_time_hour: endHour,
        end_time_minute: endMinute,
        assignment_details: resource.assignment_details || ''
      };
      
      form.reset(newFormData);
      setInitialFormData(newFormData);
    }
  }, [resource, open, form]);
  const onSubmit = async (data: FormData) => {
    if (!resource) return;
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
      await onResourceUpdated(resource.id, {
        resource: data.resource,
        location: data.location,
        assignment_details: data.assignment_details,
        start_time: startTime,
        end_time: endTime
      });
      resetChanges();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating resource:', error);
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
  const generateTimeOptions = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i.toString().padStart(2, '0'));
    }
    return hours;
  };
  const generateMinuteOptions = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 15) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };
  if (!resource) return null;
  return <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>
            Update the resource assignment for this competition.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="resource" render={({
            field
          }) => <FormItem>
                  <FormLabel>Cadet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cadet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usersLoading ? (
                        <SelectItem value="loading" disabled>Loading cadets...</SelectItem>
                      ) : (
                        users
                          .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name))
                          .map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.last_name}, {user.first_name}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="location" render={({
            field
          }) => <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {/* Start Date & Time */}
            <div className="space-y-2">
              <FormLabel>Start Date & Time</FormLabel>
              <div className="flex gap-2">
                <FormField control={form.control} name="start_date" render={({
                field
              }) => <FormItem className="flex-1">
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>} />
                <FormField control={form.control} name="start_time_hour" render={({
                field
              }) => <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {generateTimeOptions().map(hour => <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>} />
                <FormField control={form.control} name="start_time_minute" render={({
                field
              }) => <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {generateMinuteOptions().map(minute => <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>} />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-2">
              <FormLabel>End Date & Time</FormLabel>
              <div className="flex gap-2">
                <FormField control={form.control} name="end_date" render={({
                field
              }) => <FormItem className="flex-1">
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>} />
                <FormField control={form.control} name="end_time_hour" render={({
                field
              }) => <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {generateTimeOptions().map(hour => <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>} />
                <FormField control={form.control} name="end_time_minute" render={({
                field
              }) => <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {generateMinuteOptions().map(minute => <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>} />
              </div>
            </div>

            <FormField control={form.control} name="assignment_details" render={({
            field
          }) => <FormItem>
                  <FormLabel>Assignment Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional details about the assignment..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

             <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Update Resource</Button>
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