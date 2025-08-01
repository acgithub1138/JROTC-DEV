import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompEventInsert = Database['public']['Tables']['cp_comp_events']['Insert'];

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onEventAdded: (event: Omit<CompEventInsert, 'school_id' | 'created_by'> & { competition_id: string }) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  onEventAdded
}) => {
  const [formData, setFormData] = useState({
    event: '',
    location: '',
    start_time: '',
    end_time: '',
    max_participants: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (open) {
      fetchEvents();
    }
  }, [open]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('cp_events')
        .select('id, name')
        .eq('active', true);
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event) {
      toast.error('Please select an event');
      return;
    }

    setIsLoading(true);
    try {
      const eventData: Omit<CompEventInsert, 'school_id' | 'created_by'> & { competition_id: string } = {
        competition_id: competitionId,
        event: formData.event,
        location: formData.location || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        notes: formData.notes || null
      };

      await onEventAdded(eventData);
      onOpenChange(false);
      setFormData({
        event: '',
        location: '',
        start_time: '',
        end_time: '',
        max_participants: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Competition Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="event">Event *</Label>
            <Select value={formData.event} onValueChange={(value) => setFormData(prev => ({ ...prev, event: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Event location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="max_participants">Max Participants</Label>
            <Input
              id="max_participants"
              type="number"
              min="1"
              value={formData.max_participants}
              onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
              placeholder="Maximum number of participants"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes for this event"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};