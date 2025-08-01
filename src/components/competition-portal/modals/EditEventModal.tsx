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
    start_date: '',
    start_time_hour: '09',
    start_time_minute: '00',
    end_date: '',
    end_time_hour: '10',
    end_time_minute: '00',
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
      // Parse start time
      const startDate = event.start_time ? new Date(event.start_time) : null;
      const endDate = event.end_time ? new Date(event.end_time) : null;
      
      setFormData({
        event: event.event || '',
        location: event.location || '',
        start_date: startDate ? startDate.toISOString().split('T')[0] : '',
        start_time_hour: startDate ? startDate.getHours().toString().padStart(2, '0') : '09',
        start_time_minute: startDate ? startDate.getMinutes().toString().padStart(2, '0') : '00',
        end_date: endDate ? endDate.toISOString().split('T')[0] : '',
        end_time_hour: endDate ? endDate.getHours().toString().padStart(2, '0') : '10',
        end_time_minute: endDate ? endDate.getMinutes().toString().padStart(2, '0') : '00',
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
    if (!formData.event || !event) {
      toast.error('Please select an event');
      return;
    }

    setIsLoading(true);
    try {
      // Combine date and time into ISO strings
      const startDateTime = formData.start_date && formData.start_time_hour && formData.start_time_minute
        ? new Date(`${formData.start_date}T${formData.start_time_hour}:${formData.start_time_minute}:00`).toISOString()
        : null;
      
      const endDateTime = formData.end_date && formData.end_time_hour && formData.end_time_minute
        ? new Date(`${formData.end_date}T${formData.end_time_hour}:${formData.end_time_minute}:00`).toISOString()
        : null;

      const updates: CompEventUpdate = {
        event: formData.event,
        location: formData.location || null,
        start_time: startDateTime,
        end_time: endDateTime,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
          <div>
            <Label>Start Date & Time</Label>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, start_date: e.target.value }));
                    // Auto-set end date if empty
                    if (!formData.end_date) {
                      setFormData(prev => ({ ...prev, end_date: e.target.value }));
                    }
                  }}
                />
              </div>
              <div>
                <Select value={formData.start_time_hour} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, start_time_hour: value }));
                  // Auto-set end time to 1 hour later
                  const endHour = (parseInt(value) + 1) % 24;
                  setFormData(prev => ({ ...prev, end_time_hour: endHour.toString().padStart(2, '0') }));
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
              </div>
              <div>
                <Select value={formData.start_time_minute} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, start_time_minute: value }));
                  setFormData(prev => ({ ...prev, end_time_minute: value }));
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
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              <div>
                <Select value={formData.end_time_hour} onValueChange={(value) => setFormData(prev => ({ ...prev, end_time_hour: value }))}>
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
                <Select value={formData.end_time_minute} onValueChange={(value) => setFormData(prev => ({ ...prev, end_time_minute: value }))}>
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
              {isLoading ? 'Updating...' : 'Update Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};