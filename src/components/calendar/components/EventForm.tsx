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
    end_date: '',
    location: '',
    event_type: 'other' as 'training' | 'competition' | 'ceremony' | 'meeting' | 'drill' | 'other',
    is_all_day: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        start_date: event.start_date.slice(0, 16), // Format for datetime-local input
        end_date: event.end_date ? event.end_date.slice(0, 16) : '',
        location: event.location || '',
        event_type: event.event_type,
        is_all_day: event.is_all_day,
      });
    } else if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setFormData(prev => ({
        ...prev,
        start_date: `${dateStr}T09:00`,
        end_date: `${dateStr}T10:00`,
      }));
    }
  }, [event, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const eventData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start Date & Time *</Label>
            <Input
              id="start_date"
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="end_date">End Date & Time</Label>
            <Input
              id="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
            />
          </div>
        </div>
      )}

      {formData.is_all_day && (
        <div>
          <Label htmlFor="start_date_day">Event Date *</Label>
          <Input
            id="start_date_day"
            type="date"
            value={formData.start_date.split('T')[0]}
            onChange={(e) => {
              const dateStr = e.target.value;
              handleChange('start_date', `${dateStr}T00:00`);
              handleChange('end_date', `${dateStr}T23:59`);
            }}
            required
          />
        </div>
      )}

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