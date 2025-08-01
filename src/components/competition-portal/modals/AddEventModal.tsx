import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

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

  const addJudge = (judgeId: string) => {
    if (!formData.judges.includes(judgeId)) {
      setFormData(prev => ({
        ...prev,
        judges: [...prev.judges, judgeId]
      }));
    }
  };

  const removeJudge = (judgeId: string) => {
    setFormData(prev => ({
      ...prev,
      judges: prev.judges.filter(id => id !== judgeId)
    }));
  };

  const addResource = (resourceId: string) => {
    if (!formData.resources.includes(resourceId)) {
      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, resourceId]
      }));
    }
  };

  const removeResource = (resourceId: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter(id => id !== resourceId)
    }));
  };

  const getSelectedJudges = () => {
    return judges.filter(judge => formData.judges.includes(judge.id));
  };

  const getAvailableJudges = () => {
    return judges.filter(judge => !formData.judges.includes(judge.id));
  };

  const getSelectedResources = () => {
    return schoolUsers.filter(user => formData.resources.includes(user.id));
  };

  const getAvailableResources = () => {
    return schoolUsers.filter(user => !formData.resources.includes(user.id));
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
        notes: formData.notes || null,
        judges: formData.judges,
        resources: formData.resources
      };

      await onEventAdded(eventData);
      onOpenChange(false);
      setFormData({
        event: '',
        location: '',
        start_time: '',
        end_time: '',
        max_participants: '',
        notes: '',
        judges: [],
        resources: []
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
            <Label>Judges</Label>
            <div className="space-y-2">
              <Select onValueChange={addJudge}>
                <SelectTrigger>
                  <SelectValue placeholder="Add judges" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableJudges().map((judge) => (
                    <SelectItem key={judge.id} value={judge.id}>
                      {judge.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {getSelectedJudges().length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedJudges().map((judge) => (
                    <Badge key={judge.id} variant="secondary" className="flex items-center gap-1">
                      {judge.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeJudge(judge.id)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Resources</Label>
            <div className="space-y-2">
              <Select onValueChange={addResource}>
                <SelectTrigger>
                  <SelectValue placeholder="Add resources" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableResources().map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.last_name}, {user.first_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {getSelectedResources().length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedResources().map((user) => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      {user.last_name}, {user.first_name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeResource(user.id)}
                      />
                    </Badge>
                  ))}
                </div>
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
              {isLoading ? 'Adding...' : 'Add Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};