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
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus } from 'lucide-react';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Event } from './CalendarManagementPage';
import { useEvents } from './hooks/useEvents';
import { useEventTypes } from './hooks/useEventTypes';
import { useCalendarPermissions } from '@/hooks/useModuleSpecificPermissions';
import { AddressLookupField } from './components/AddressLookupField';
import { RecurrenceSettings } from './components/RecurrenceSettings';
import { RecurrenceRule } from '@/utils/recurrence';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToSchoolTimezone, convertFromSchoolTimezone } from '@/utils/timezoneUtils';
import { EventAssignmentSection } from './components/EventAssignmentSection';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';

const eventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  start_time_hour: z.string().min(1, 'Start hour is required'),
  start_time_minute: z.string().min(1, 'Start minute is required'),
  end_date: z.string().optional(),
  end_time_hour: z.string().optional(),
  end_time_minute: z.string().optional(),
  location: z.string().optional(),
  event_type: z.string().optional(),
  is_all_day: z.boolean().default(false)
});

type EventFormData = z.infer<typeof eventSchema>;

export const CalendarRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canUpdate, canDelete, canCreate } = useCalendarPermissions();
  const { timezone, isLoading: timezoneLoading } = useSchoolTimezone();
  const { toast } = useToast();
  
  const eventId = searchParams.get('id');
  const selectedDateParam = searchParams.get('date');
  const isEditMode = !!eventId;
  const isViewMode = searchParams.get('view') === 'true';
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showAddEventTypeDialog, setShowAddEventTypeDialog] = useState(false);
  const [newEventTypeName, setNewEventTypeName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    frequency: 'daily',
    interval: 1,
    endType: 'never',
  });

  const { events, createEvent, updateEvent, deleteEvent } = useEvents({ eventType: '', assignedTo: '' });
  const { eventTypes, isLoading: eventTypesLoading, createEventType } = useEventTypes();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      start_time_hour: '09',
      start_time_minute: '00',
      end_date: '',
      end_time_hour: '10',
      end_time_minute: '00',
      location: '',
      event_type: '',
      is_all_day: false
    }
  });

  // Initial form data for comparison
  const initialFormData = {
    title: event?.title || '',
    description: event?.description || '',
    start_date: event ? format(convertToSchoolTimezone(event.start_date, timezone), 'yyyy-MM-dd') : selectedDateParam || '',
    start_time_hour: event ? format(convertToSchoolTimezone(event.start_date, timezone), 'HH') : '09',
    start_time_minute: event ? format(convertToSchoolTimezone(event.start_date, timezone), 'mm') : '00',
    end_date: event && event.end_date ? format(convertToSchoolTimezone(event.end_date, timezone), 'yyyy-MM-dd') : selectedDateParam || '',
    end_time_hour: event && event.end_date ? format(convertToSchoolTimezone(event.end_date, timezone), 'HH') : '10',
    end_time_minute: event && event.end_date ? format(convertToSchoolTimezone(event.end_date, timezone), 'mm') : '00',
    location: event?.location || '',
    event_type: event?.event_type || '',
    is_all_day: event?.is_all_day || false
  };

  // Get current form values
  const watchedData = form.watch();
  const currentFormData = {
    title: watchedData.title || '',
    description: watchedData.description || '',
    start_date: watchedData.start_date || '',
    start_time_hour: watchedData.start_time_hour || '09',
    start_time_minute: watchedData.start_time_minute || '00',
    end_date: watchedData.end_date || '',
    end_time_hour: watchedData.end_time_hour || '10',
    end_time_minute: watchedData.end_time_minute || '00',
    location: watchedData.location || '',
    event_type: watchedData.event_type || '',
    is_all_day: watchedData.is_all_day || false
  };

  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: currentFormData,
    enabled: !isViewMode
  });

  // Load event data if editing
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId || timezoneLoading || !events || events.length === 0) return;
      
      setIsLoading(true);
      try {
        const foundEvent = events.find(e => e.id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
          
          // Convert UTC event dates to school timezone for display
          const startDate = convertToSchoolTimezone(foundEvent.start_date, timezone);
          const endDate = foundEvent.end_date ? convertToSchoolTimezone(foundEvent.end_date, timezone) : null;
          
          form.reset({
            title: foundEvent.title,
            description: foundEvent.description || '',
            start_date: format(startDate, 'yyyy-MM-dd'),
            start_time_hour: format(startDate, 'HH'),
            start_time_minute: format(startDate, 'mm'),
            end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '',
            end_time_hour: endDate ? format(endDate, 'HH') : '10',
            end_time_minute: endDate ? format(endDate, 'mm') : '00',
            location: foundEvent.location || '',
            event_type: foundEvent.event_type || '',
            is_all_day: foundEvent.is_all_day
          });

          // Set recurrence data for existing events
          setIsRecurring(foundEvent.is_recurring || false);
          if (foundEvent.recurrence_rule) {
            setRecurrenceRule(foundEvent.recurrence_rule);
          }
        } else {
          toast({
            title: 'Error',
            description: 'Event not found',
            variant: 'destructive'
          });
          navigate('/app/calendar');
        }
      } catch (error) {
        console.error('Error loading event:', error);
        toast({
          title: 'Error',
          description: 'Failed to load event',
          variant: 'destructive'
        });
        navigate('/app/calendar');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [eventId, events, form, navigate, timezone, timezoneLoading, toast]);

  // Set default values for new events
  useEffect(() => {
    if (!isEditMode && selectedDateParam && !timezoneLoading && !eventTypesLoading) {
      // Find the "Event" type as default
      const defaultEventType = eventTypes.find(type => type.label.toLowerCase() === 'event');
      
      form.reset({
        title: '',
        description: '',
        start_date: selectedDateParam,
        start_time_hour: '09',
        start_time_minute: '00',
        end_date: selectedDateParam,
        end_time_hour: '10',
        end_time_minute: '00',
        location: '',
        event_type: defaultEventType?.id || '',
        is_all_day: false
      });
    }
  }, [isEditMode, selectedDateParam, timezoneLoading, eventTypesLoading, eventTypes, form]);

  const validateDateTime = (data: EventFormData) => {
    if (!data.start_date) return { isValid: true, error: '' };
    
    // If no end date, it's valid (end date is optional)
    if (!data.end_date) return { isValid: true, error: '' };
    
    const startDateTime = new Date(`${data.start_date}T${data.start_time_hour}:${data.start_time_minute}:00`);
    const endDateTime = new Date(`${data.end_date}T${data.end_time_hour}:${data.end_time_minute}:00`);
    
    if (endDateTime <= startDateTime) {
      return { 
        isValid: false, 
        error: 'End date and time must be after start date and time' 
      };
    }
    
    return { isValid: true, error: '' };
  };

  const handleSubmit = async (data: EventFormData) => {
    try {
      // Validate date/time
      const validation = validateDateTime(data);
      if (!validation.isValid) {
        toast({
          title: 'Error',
          description: validation.error,
          variant: 'destructive'
        });
        return;
      }

      // Create dates in school timezone, then convert to UTC for storage
      const startDateTime = new Date(`${data.start_date}T${data.start_time_hour}:${data.start_time_minute}:00`);
      const endDateTime = data.end_date ? new Date(`${data.end_date}T${data.end_time_hour}:${data.end_time_minute}:00`) : null;
      
      // Convert from school timezone to UTC
      const startDateUTC = convertFromSchoolTimezone(startDateTime, timezone);
      const endDateUTC = endDateTime ? convertFromSchoolTimezone(endDateTime, timezone) : null;

      const eventData = {
        title: data.title,
        description: data.description,
        location: data.location,
        event_type: data.event_type || null,
        is_all_day: data.is_all_day,
        start_date: startDateUTC.toISOString(),
        end_date: endDateUTC ? endDateUTC.toISOString() : null,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : null,
        recurrence_end_date: isRecurring && recurrenceRule.endType === 'date' && recurrenceRule.endDate 
          ? convertFromSchoolTimezone(new Date(recurrenceRule.endDate), timezone).toISOString() 
          : null,
      };

      if (isEditMode && event) {
        await updateEvent(event.id, eventData);
        toast({
          title: 'Success',
          description: 'Event updated successfully'
        });
      } else {
        await createEvent(eventData);
        toast({
          title: 'Success',
          description: 'Event created successfully'
        });
      }
      
      navigate('/app/calendar');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to save event',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    try {
      await deleteEvent(event.id);
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      });
      navigate('/app/calendar');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive'
      });
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges && !isViewMode) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/app/calendar');
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate('/app/calendar');
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  const handleAddEventType = async () => {
    if (!newEventTypeName.trim()) return;

    // Generate value from label (lowercase, replace spaces with underscores)
    const value = newEventTypeName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const newEventType = await createEventType(value, newEventTypeName.trim());
    if (newEventType) {
      form.setValue('event_type', newEventType.id);
      setNewEventTypeName('');
      setShowAddEventTypeDialog(false);
      toast({
        title: 'Success',
        description: 'Event type created successfully'
      });
    }
  };

  const handleFieldChange = (field: keyof EventFormData, value: any) => {
    form.setValue(field, value);
    
    // Auto-set end date when start date changes (only if end date is empty or same as previous start date)
    if (field === 'start_date' && value) {
      const currentEndDate = form.getValues('end_date');
      const currentStartDate = form.getValues('start_date');
      if (!currentEndDate || currentEndDate === currentStartDate) {
        form.setValue('end_date', value);
      }
    }
    
    // Auto-update end time when start time changes (add 1 hour)
    if ((field === 'start_time_hour' || field === 'start_time_minute') && !form.getValues('is_all_day')) {
      const startHour = field === 'start_time_hour' ? parseInt(value) : parseInt(form.getValues('start_time_hour') || '0');
      const startMinute = field === 'start_time_minute' ? parseInt(value) : parseInt(form.getValues('start_time_minute') || '0');
      
      // Add 1 hour to start time
      let endHour = startHour + 1;
      let endMinute = startMinute;
      
      // Handle hour overflow (24:00 -> 00:00 next day)
      if (endHour >= 24) {
        endHour = endHour - 24;
        // If we overflow to the next day, update the end date too
        const startDate = form.getValues('start_date');
        const endDate = form.getValues('end_date');
        if (startDate && (!endDate || endDate === startDate)) {
          const nextDay = new Date(startDate);
          nextDay.setDate(nextDay.getDate() + 1);
          form.setValue('end_date', nextDay.toISOString().split('T')[0]);
        }
      } else {
        // Make sure end date matches start date if we're not overflowing
        const startDate = form.getValues('start_date');
        const endDate = form.getValues('end_date');
        if (startDate && (!endDate || endDate !== startDate)) {
          form.setValue('end_date', startDate);
        }
      }
      
      form.setValue('end_time_hour', endHour.toString().padStart(2, '0'));
      form.setValue('end_time_minute', endMinute.toString().padStart(2, '0'));
    }
  };

  const canEdit = isViewMode ? false : (event ? canUpdate : canCreate);
  const canDeleteEvent = event ? canDelete : false;

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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Calendar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isViewMode ? 'View Event' : isEditMode ? 'Edit Event' : 'Add Event'}
          </h1>
          <p className="text-muted-foreground">
            {isViewMode ? 'View event details' : isEditMode ? 'Update event information' : 'Create a new calendar event'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Row 1: Title - Event Type */}
              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-16 text-left shrink-0">Title *</FormLabel>
                      <div className="flex-1">
                        <FormControl>
                          <Input 
                            placeholder="Enter event title" 
                            {...field} 
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-16 text-left shrink-0">Type</FormLabel>
                      <div className="flex-1 flex gap-2">
                        <Select 
                          value={field.value} 
                          onValueChange={(value) => handleFieldChange('event_type', value)}
                          disabled={!canEdit}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                            {eventTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {canEdit && (
                          <Dialog open={showAddEventTypeDialog} onOpenChange={setShowAddEventTypeDialog}>
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline" size="sm" title="Add new Event Type">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Add New Event Type</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <FormLabel htmlFor="new_event_type">Event Type Name</FormLabel>
                                  <Input
                                    id="new_event_type"
                                    value={newEventTypeName}
                                    onChange={(e) => setNewEventTypeName(e.target.value)}
                                    placeholder="Enter event type name"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setShowAddEventTypeDialog(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="button" 
                                    onClick={handleAddEventType}
                                    disabled={!newEventTypeName.trim()}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Location - All Day */}
              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-16 text-left shrink-0">Location</FormLabel>
                      <div className="flex-1">
                        <FormControl>
                          <AddressLookupField
                            value={field.value || ''}
                            onValueChange={(value) => handleFieldChange('location', value)}
                            placeholder="Enter location or search address"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_all_day"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-16 text-left shrink-0">All Day</FormLabel>
                      <div className="flex-1">
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => handleFieldChange('is_all_day', checked)}
                              disabled={!canEdit}
                            />
                            <FormLabel>All day event</FormLabel>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Date & Time Fields */}
              {!form.watch('is_all_day') && (
                <div className="space-y-4">
                  {/* Start Date & Time */}
                  <div className="flex items-center gap-2">
                    <FormLabel className="w-16 text-left shrink-0">Start *</FormLabel>
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="start_date"
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => handleFieldChange('start_date', e.target.value)}
                                disabled={!canEdit}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="start_time_hour"
                          render={({ field }) => (
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => handleFieldChange('start_time_hour', value)}
                              disabled={!canEdit}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="start_time_minute"
                          render={({ field }) => (
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => handleFieldChange('start_time_minute', value)}
                              disabled={!canEdit}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                                {['00', '10', '20', '30', '40', '50'].map((minute) => (
                                  <SelectItem key={minute} value={minute}>
                                    {minute}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div className="flex items-center gap-2">
                    <FormLabel className="w-16 text-left shrink-0">End</FormLabel>
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="end_date"
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => handleFieldChange('end_date', e.target.value)}
                                disabled={!canEdit}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="end_time_hour"
                          render={({ field }) => (
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => handleFieldChange('end_time_hour', value)}
                              disabled={!canEdit}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="end_time_minute"
                          render={({ field }) => (
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => handleFieldChange('end_time_minute', value)}
                              disabled={!canEdit}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                                {['00', '10', '20', '30', '40', '50'].map((minute) => (
                                  <SelectItem key={minute} value={minute}>
                                    {minute}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Day Date Fields */}
              {form.watch('is_all_day') && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FormLabel className="w-16 text-left shrink-0">Start *</FormLabel>
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              onChange={(e) => {
                                const dateStr = e.target.value;
                                handleFieldChange('start_date', dateStr);
                                // Auto-set end date if empty or same as previous start date
                                const currentEndDate = form.getValues('end_date');
                                if (!currentEndDate || currentEndDate === form.getValues('start_date')) {
                                  handleFieldChange('end_date', dateStr);
                                }
                                handleFieldChange('start_time_hour', '00');
                                handleFieldChange('start_time_minute', '00');
                              }}
                              disabled={!canEdit}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FormLabel className="w-16 text-left shrink-0">End</FormLabel>
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              onChange={(e) => {
                                const dateStr = e.target.value;
                                handleFieldChange('end_date', dateStr);
                                handleFieldChange('end_time_hour', '23');
                                handleFieldChange('end_time_minute', '59');
                              }}
                              disabled={!canEdit}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-2">
                    <FormLabel className="w-32 text-left shrink-0 pt-2">Description</FormLabel>
                    <div className="flex-1">
                      <FormControl>
                        <Textarea 
                          placeholder="Enter event description" 
                          className="resize-none min-h-[100px]" 
                          {...field}
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Recurrence Settings */}
              {canEdit && (
                <RecurrenceSettings
                  isRecurring={isRecurring}
                  onRecurringChange={setIsRecurring}
                  recurrenceRule={recurrenceRule}
                  onRecurrenceRuleChange={setRecurrenceRule}
                  eventStartDate={form.watch('start_date')}
                />
              )}

              {/* Event Assignments for existing events */}
              {event && (
                <EventAssignmentSection eventId={event.id} />
              )}

              {/* Attachments for existing events */}
              {event && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                  <AttachmentSection 
                    recordType="event" 
                    recordId={event.id} 
                    canEdit={canEdit} 
                    defaultOpen={true} 
                    showContentOnly={true} 
                  />
                </div>
              )}

              <div className="flex justify-between pt-6">
                {event && canDeleteEvent && !isViewMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete Event
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    {isViewMode ? 'Back' : 'Cancel'}
                  </Button>
                  {!isViewMode && canEdit && (
                    <Button type="submit">
                      {isEditMode ? 'Update Event' : 'Create Event'}
                    </Button>
                  )}
                </div>
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
    </div>
  );
};