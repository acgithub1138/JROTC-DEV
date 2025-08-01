import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

type CompEvent = Database['public']['Tables']['cp_comp_events']['Row'] & {
  cp_events?: { name: string } | null;
};
type CompEventUpdate = Database['public']['Tables']['cp_comp_events']['Update'];

interface EditEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CompEvent | null;
  onEventUpdated: (id: string, updates: CompEventUpdate) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  open,
  onOpenChange,
  event,
  onEventUpdated
}) => {
  const [formData, setFormData] = useState({
    event: '',
    location: '',
    start_time: '',
    end_time: '',
    max_participants: '',
    notes: '',
    judges: [] as string[],
    resources: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Array<{id: string, name: string}>>([]);
  const [judges, setJudges] = useState<Array<{id: string, name: string}>>([]);
  
  const {
    users: schoolUsers,
    isLoading: usersLoading
  } = useSchoolUsers(true); // Only active users

  useEffect(() => {
    if (open) {
      fetchEvents();
      fetchJudges();
    }
  }, [open]);

  useEffect(() => {
    if (event && events.length > 0) {
      setFormData({
        event: event.event || '',
        location: event.location || '',
        start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '',
        end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
        max_participants: event.max_participants?.toString() || '',
        notes: event.notes || '',
        judges: event.judges || [],
        resources: event.resources || []
      });
    }
  }, [event, events]);

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

  const fetchJudges = async () => {
    try {
      const { data, error } = await supabase
        .from('cp_judges')
        .select('id, name')
        .eq('available', true);
      
      if (error) throw error;
      setJudges(data || []);
    } catch (error) {
      console.error('Error fetching judges:', error);
      toast.error('Failed to load judges');
    }
  };

  const handleJudgeToggle = (judgeId: string) => {
    setFormData(prev => ({
      ...prev,
      judges: prev.judges.includes(judgeId)
        ? prev.judges.filter(id => id !== judgeId)
        : [...prev.judges, judgeId]
    }));
  };

  const handleResourceToggle = (resourceId: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.includes(resourceId)
        ? prev.resources.filter(id => id !== resourceId)
        : [...prev.resources, resourceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event || !event) {
      toast.error('Please select an event');
      return;
    }

    setIsLoading(true);
    try {
      const updates: CompEventUpdate = {
        event: formData.event,
        location: formData.location || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        notes: formData.notes || null,
        judges: formData.judges,
        resources: formData.resources
      };

      await onEventUpdated(event.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Competition Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="event">Event *</Label>
            <Select value={formData.event} onValueChange={(value) => setFormData(prev => ({ ...prev, event: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(eventOption => (
                  <SelectItem key={eventOption.id} value={eventOption.id}>
                    {eventOption.name}
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
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, start_time: e.target.value }));
                  // Auto-set end time to 1 hour after start time
                  if (e.target.value) {
                    const startDate = new Date(e.target.value);
                    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
                    const endDateString = endDate.toISOString().slice(0, 16); // Format for datetime-local
                    setFormData(prev => ({ ...prev, end_time: endDateString }));
                  }
                }}
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
            <Label htmlFor="judges">Judges</Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
              {judges.map(judge => (
                <div key={judge.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`judge-${judge.id}`}
                    checked={formData.judges.includes(judge.id)}
                    onCheckedChange={() => handleJudgeToggle(judge.id)}
                  />
                  <label htmlFor={`judge-${judge.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {judge.name}
                  </label>
                </div>
              ))}
              {judges.length === 0 && (
                <p className="text-sm text-muted-foreground">No judges available</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="resources">Resources</Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
              {schoolUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`resource-${user.id}`}
                    checked={formData.resources.includes(user.id)}
                    onCheckedChange={() => handleResourceToggle(user.id)}
                  />
                  <label htmlFor={`resource-${user.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {user.last_name}, {user.first_name}
                  </label>
                </div>
              ))}
              {schoolUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {usersLoading ? "Loading users..." : "No users available"}
                </p>
              )}
            </div>
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
              {isLoading ? 'Updating...' : 'Update Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};