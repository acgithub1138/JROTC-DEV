import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Event } from '../CalendarManagementPage';
import { EventAssignmentSection } from './EventAssignmentSection';

interface EventFormProps {
  event?: Event | null;
  selectedDate?: Date | null;
  onSubmit: (eventData: any) => Promise<void>;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  selectedDate,
  onSubmit,
  onCancel,
}) => {
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
    event_type: 'other' as 'training' | 'competition' | 'ceremony' | 'meeting' | 'drill' | 'other',
    is_all_day: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : null;
      
      setFormData({
        title: event.title,
        description: event.description || '',
        start_date: format(startDate, 'yyyy-MM-dd'),
        start_time_hour: format(startDate, 'HH'),
        start_time_minute: format(startDate, 'mm'),
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '',
        end_time_hour: endDate ? format(endDate, 'HH') : '10',
        end_time_minute: endDate ? format(endDate, 'mm') : '00',
        location: event.location || '',
        event_type: event.event_type,
        is_all_day: event.is_all_day,
      });
    } else if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setFormData(prev => ({
        ...prev,
        start_date: dateStr,
        end_date: dateStr,
      }));
    }
  }, [event, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startDateTime = `${formData.start_date}T${formData.start_time_hour}:${formData.start_time_minute}:00`;
      const endDateTime = formData.end_date ? `${formData.end_date}T${formData.end_time_hour}:${formData.end_time_minute}:00` : null;
      
      const eventData = {
        ...formData,
        start_date: new Date(startDateTime).toISOString(),
        end_date: endDateTime ? new Date(endDateTime).toISOString() : null,
      };
      
      await onSubmit(eventData);
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter event title"
          required
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
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event_type">Event Type</Label>
          <Select value={formData.event_type} onValueChange={(value) => handleChange('event_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="competition">Competition</SelectItem>
              <SelectItem value="ceremony">Ceremony</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="drill">Drill</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Enter location"
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
                    {Array.from({ length: 60 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
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
                    {Array.from({ length: 60 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
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

      {/* Show Event Assignments for existing events or when editing */}
      {event && (
        <EventAssignmentSection eventId={event.id} />
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
        </Button>
      </div>
    </form>
  );
};