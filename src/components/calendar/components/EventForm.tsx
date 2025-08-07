import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '../CalendarManagementPage';
import { EventAssignmentSection } from './EventAssignmentSection';
import { useEventTypes } from '../hooks/useEventTypes';
import { useCalendarPermissions } from '@/hooks/useModuleSpecificPermissions';
import { AddressLookupField } from './AddressLookupField';
import { RecurrenceSettings } from './RecurrenceSettings';
import { RecurrenceRule } from '@/utils/recurrence';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToSchoolTimezone, convertFromSchoolTimezone, formatInSchoolTimezone } from '@/utils/timezoneUtils';

interface EventFormProps {
  event?: Event | null;
  selectedDate?: Date | null;
  onSubmit: (eventData: any) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  onUnsavedChangesUpdate?: (hasUnsavedChanges: boolean) => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  selectedDate,
  onSubmit,
  onCancel,
  onDelete,
  onUnsavedChangesUpdate,
}) => {
  const { canUpdate, canDelete, canCreate } = useCalendarPermissions();
  const { timezone, isLoading: timezoneLoading } = useSchoolTimezone();
  const [formData, setFormData] = useState({
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
    is_all_day: false,
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    frequency: 'daily',
    interval: 1,
    endType: 'never',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddEventTypeDialog, setShowAddEventTypeDialog] = useState(false);
  const [newEventTypeName, setNewEventTypeName] = useState('');
  const { eventTypes, isLoading: eventTypesLoading, createEventType } = useEventTypes();
  const [initialFormData, setInitialFormData] = useState({
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
    is_all_day: false,
  });

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: true,
  });

  // Report unsaved changes to parent
  React.useEffect(() => {
    onUnsavedChangesUpdate?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChangesUpdate]);

  const canEdit = event ? canUpdate : canCreate;
  const canDeleteEvent = event ? canDelete : false;

  useEffect(() => {
    if (event && !timezoneLoading) {
      // Convert UTC event dates to school timezone for display
      const startDate = convertToSchoolTimezone(event.start_date, timezone);
      const endDate = event.end_date ? convertToSchoolTimezone(event.end_date, timezone) : null;
      
      const eventFormData = {
        title: event.title,
        description: event.description || '',
        start_date: format(startDate, 'yyyy-MM-dd'),
        start_time_hour: format(startDate, 'HH'),
        start_time_minute: format(startDate, 'mm'),
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '',
        end_time_hour: endDate ? format(endDate, 'HH') : '10',
        end_time_minute: endDate ? format(endDate, 'mm') : '00',
        location: event.location || '',
        event_type: event.event_type || '',
        is_all_day: event.is_all_day,
      };

      setFormData(eventFormData);
      setInitialFormData(eventFormData);

      // Set recurrence data for existing events
      setIsRecurring(event.is_recurring || false);
      if (event.recurrence_rule) {
        setRecurrenceRule(event.recurrence_rule);
      }
    } else if (selectedDate && !timezoneLoading) {
      // Convert selected date to school timezone for display
      const schoolDate = convertToSchoolTimezone(selectedDate, timezone);
      const dateStr = format(schoolDate, 'yyyy-MM-dd');
      const newFormData = {
        title: '',
        description: '',
        start_date: dateStr,
        start_time_hour: '09',
        start_time_minute: '00',
        end_date: dateStr,
        end_time_hour: '10',
        end_time_minute: '00',
        location: '',
        event_type: '',
        is_all_day: false,
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
  }, [event, selectedDate, timezone, timezoneLoading]);

  const validateDateTime = () => {
    if (!formData.start_date) return { isValid: true, error: '' };
    
    // If no end date, it's valid (end date is optional)
    if (!formData.end_date) return { isValid: true, error: '' };
    
    const startDateTime = new Date(`${formData.start_date}T${formData.start_time_hour}:${formData.start_time_minute}:00`);
    const endDateTime = new Date(`${formData.end_date}T${formData.end_time_hour}:${formData.end_time_minute}:00`);
    
    if (endDateTime <= startDateTime) {
      return { 
        isValid: false, 
        error: 'End date and time must be after start date and time' 
      };
    }
    
    return { isValid: true, error: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date/time
    const validation = validateDateTime();
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Create dates in school timezone, then convert to UTC for storage
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time_hour}:${formData.start_time_minute}:00`);
      const endDateTime = formData.end_date ? new Date(`${formData.end_date}T${formData.end_time_hour}:${formData.end_time_minute}:00`) : null;
      
      // Convert from school timezone to UTC
      const startDateUTC = convertFromSchoolTimezone(startDateTime, timezone);
      const endDateUTC = endDateTime ? convertFromSchoolTimezone(endDateTime, timezone) : null;
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        event_type: formData.event_type, // Reference to event_types table
        is_all_day: formData.is_all_day,
        start_date: startDateUTC.toISOString(),
        end_date: endDateUTC ? endDateUTC.toISOString() : null,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : null,
        recurrence_end_date: isRecurring && recurrenceRule.endType === 'date' && recurrenceRule.endDate 
          ? convertFromSchoolTimezone(new Date(recurrenceRule.endDate), timezone).toISOString() 
          : null,
      };
      
      await onSubmit(eventData);
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEventType = async () => {
    if (!newEventTypeName.trim()) return;

    const newEventType = await createEventType(newEventTypeName.trim());
    if (newEventType) {
      setFormData(prev => ({ ...prev, event_type: newEventType.id }));
      setNewEventTypeName('');
      setShowAddEventTypeDialog(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };


  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };
      
      // Auto-set end date when start date changes (only if end date is empty or same as previous start date)
      if (field === 'start_date' && value && (!prev.end_date || prev.end_date === prev.start_date)) {
        newData.end_date = value;
      }
      
      // Auto-update end time when start time changes (add 1 hour)
      if ((field === 'start_time_hour' || field === 'start_time_minute') && !prev.is_all_day) {
        const startHour = field === 'start_time_hour' ? parseInt(value) : parseInt(prev.start_time_hour || '0');
        const startMinute = field === 'start_time_minute' ? parseInt(value) : parseInt(prev.start_time_minute || '0');
        
        // Add 1 hour to start time
        let endHour = startHour + 1;
        let endMinute = startMinute;
        
        // Handle hour overflow (24:00 -> 00:00 next day)
        if (endHour >= 24) {
          endHour = endHour - 24;
          // If we overflow to the next day, update the end date too
          if (newData.start_date && (!newData.end_date || newData.end_date === newData.start_date)) {
            const nextDay = new Date(newData.start_date);
            nextDay.setDate(nextDay.getDate() + 1);
            newData.end_date = nextDay.toISOString().split('T')[0];
          }
        } else {
          // Make sure end date matches start date if we're not overflowing
          if (newData.start_date && (!newData.end_date || newData.end_date !== newData.start_date)) {
            newData.end_date = newData.start_date;
          }
        }
        
        newData.end_time_hour = endHour.toString().padStart(2, '0');
        newData.end_time_minute = endMinute.toString().padStart(2, '0');
      }
      
      return newData;
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter event title"
          required
          disabled={!canEdit}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter event description"
          rows={3}
          disabled={!canEdit}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event_type">Event Type</Label>
          <div className="flex gap-2">
            <Select value={formData.event_type} onValueChange={(value) => handleChange('event_type', value)} disabled={!canEdit}>
              <SelectTrigger disabled={!canEdit}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={showAddEventTypeDialog} onOpenChange={setShowAddEventTypeDialog}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Event Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new_event_type">Event Type Name</Label>
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
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <AddressLookupField
            value={formData.location}
            onValueChange={(value) => handleChange('location', value)}
            placeholder="Enter location or search address"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_all_day"
          checked={formData.is_all_day}
          onCheckedChange={(checked) => handleChange('is_all_day', checked)}
        />
        <Label htmlFor="is_all_day">All day event</Label>
      </div>

      {!formData.is_all_day && (
        <div className="space-y-4">
          <div>
            <Label>Start Date & Time *</Label>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Select value={formData.start_time_hour} onValueChange={(value) => handleChange('start_time_hour', value)}>
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
              </div>
              <div>
                <Select value={formData.start_time_minute} onValueChange={(value) => handleChange('start_time_minute', value)}>
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
              </div>
            </div>
          </div>

          <div>
            <Label>End Date & Time</Label>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                />
              </div>
              <div>
                <Select value={formData.end_time_hour} onValueChange={(value) => handleChange('end_time_hour', value)}>
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
              </div>
              <div>
                <Select value={formData.end_time_minute} onValueChange={(value) => handleChange('end_time_minute', value)}>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {formData.is_all_day && (
        <div>
          <Label htmlFor="start_date_day">Event Date *</Label>
          <Input
            id="start_date_day"
            type="date"
            value={formData.start_date}
            onChange={(e) => {
              const dateStr = e.target.value;
              handleChange('start_date', dateStr);
              handleChange('end_date', dateStr);
              handleChange('start_time_hour', '00');
              handleChange('start_time_minute', '00');
              handleChange('end_time_hour', '23');
              handleChange('end_time_minute', '59');
            }}
            required
          />
        </div>
      )}

      <RecurrenceSettings
        isRecurring={isRecurring}
        onRecurringChange={setIsRecurring}
        recurrenceRule={recurrenceRule}
        onRecurrenceRuleChange={setRecurrenceRule}
      />

      {/* Show Event Assignments for existing events or when editing */}
      {event && (
        <EventAssignmentSection eventId={event.id} />
      )}

      <div className="flex justify-between pt-4 border-t">
        {event && onDelete && canDeleteEvent && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete Event
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !canEdit}>
            {isSubmitting ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
          </Button>
        </div>
      </div>
    </form>

    </>
  );
};