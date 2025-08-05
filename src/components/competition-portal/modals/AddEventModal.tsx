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
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatInSchoolTimezone } from '@/utils/timezoneUtils';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
type CompEventInsert = Database['public']['Tables']['cp_comp_events']['Insert'];
interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onEventAdded: (event: Omit<CompEventInsert, 'school_id' | 'created_by'> & {
    competition_id: string;
  }) => void;
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
    start_date: '',
    start_hour: '',
    start_minute: '',
    end_date: '',
    end_hour: '',
    end_minute: '',
    lunch_start_time: '',
    lunch_end_time: '',
    max_participants: '',
    fee: '',
    notes: '',
    judges: [] as string[],
    resources: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [judges, setJudges] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const {
    users: schoolUsers,
    isLoading: usersLoading
  } = useSchoolUsers(true); // Only active users
  const { timezone, isLoading: timezoneLoading } = useSchoolTimezone();
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Track initial data for unsaved changes
  const initialFormData = {
    event: '',
    location: '',
    start_date: '',
    start_hour: '',
    start_minute: '',
    end_date: '',
    end_hour: '',
    end_minute: '',
    lunch_start_time: '',
    lunch_end_time: '',
    max_participants: '',
    fee: '',
    notes: '',
    judges: [] as string[],
    resources: [] as string[]
  };
  
  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: open
  });

  useEffect(() => {
    if (open) {
      fetchEvents();
      fetchJudges();
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
        
        setFormData(prev => ({
          ...prev,
          start_date: startDate,
          end_date: endDate
        }));
      }
    } catch (error) {
      console.error('Error fetching competition date:', error);
    }
  };
  const fetchEvents = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('cp_events').select('id, name').eq('active', true);
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };
  const fetchJudges = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('cp_judges').select('id, name').eq('available', true);
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
  const combineDateTime = (date: string, hour: string, minute: string): string | null => {
    if (!date || !hour || !minute) return null;
    return `${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event) {
      toast.error('Please select an event');
      return;
    }
    setIsLoading(true);
    try {
      const start_time = combineDateTime(formData.start_date, formData.start_hour, formData.start_minute);
      const end_time = combineDateTime(formData.end_date, formData.end_hour, formData.end_minute);
      const eventData: any = {
        competition_id: competitionId,
        event: formData.event,
        location: formData.location || null,
        start_time: start_time || null,
        end_time: end_time || null,
        lunch_start_time: formData.lunch_start_time ? new Date(`1970-01-01T${formData.lunch_start_time}:00Z`).toISOString() : null,
        lunch_end_time: formData.lunch_end_time ? new Date(`1970-01-01T${formData.lunch_end_time}:00Z`).toISOString() : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        fee: formData.fee ? parseFloat(formData.fee) : null,
        notes: formData.notes || null,
        judges: formData.judges,
        resources: formData.resources
      };
      await onEventAdded(eventData);
      handleClose();
      setFormData({
        event: '',
        location: '',
        start_date: '',
        start_hour: '',
        start_minute: '',
        end_date: '',
        end_hour: '',
        end_minute: '',
        lunch_start_time: '',
        lunch_end_time: '',
        max_participants: '',
        fee: '',
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

  const handleClose = () => {
    if (hasUnsavedChanges && !isLoading) {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Competition Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="event">Event *</Label>
            <Select value={formData.event} onValueChange={value => setFormData(prev => ({
            ...prev,
            event: value
          }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={formData.location} onChange={e => setFormData(prev => ({
            ...prev,
            location: e.target.value
          }))} placeholder="Event location" />
          </div>

          <div className="space-y-4">
            <div>
              <Label>Start Date & Time</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="start_date" className="text-xs">Date</Label>
                  <Input id="start_date" type="date" value={formData.start_date} onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    start_date: e.target.value
                  }));
                  // Auto-set end date if not set
                  if (e.target.value && !formData.end_date) {
                    setFormData(prev => ({
                      ...prev,
                      end_date: e.target.value
                    }));
                  }
                }} />
                </div>
                <div>
                  <Label htmlFor="start_hour" className="text-xs">Hour</Label>
                  <Select value={formData.start_hour} onValueChange={value => {
                  setFormData(prev => ({
                    ...prev,
                    start_hour: value
                  }));
                  // Auto-set end hour if not set
                  if (value && !formData.end_hour) {
                    const nextHour = (parseInt(value) + 1).toString().padStart(2, '0');
                    setFormData(prev => ({
                      ...prev,
                      end_hour: nextHour > '23' ? '23' : nextHour
                    }));
                  }
                }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hr" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({
                      length: 24
                    }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start_minute" className="text-xs">Min</Label>
                  <Select value={formData.start_minute} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  start_minute: value
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({
                      length: 60
                    }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label>End Date & Time</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="end_date" className="text-xs">Date</Label>
                  <Input id="end_date" type="date" value={formData.end_date} onChange={e => setFormData(prev => ({
                  ...prev,
                  end_date: e.target.value
                }))} />
                </div>
                <div>
                  <Label htmlFor="end_hour" className="text-xs">Hour</Label>
                  <Select value={formData.end_hour} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  end_hour: value
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hr" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({
                      length: 24
                    }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="end_minute" className="text-xs">Min</Label>
                  <Select value={formData.end_minute} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  end_minute: value
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({
                      length: 60
                    }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Judge Lunch Break</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lunch_start_time" className="text-xs">Start Time</Label>
                <Input 
                  id="lunch_start_time" 
                  type="time" 
                  value={formData.lunch_start_time} 
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    lunch_start_time: e.target.value
                  }))} 
                />
              </div>
              <div>
                <Label htmlFor="lunch_end_time" className="text-xs">End Time</Label>
                <Input 
                  id="lunch_end_time" 
                  type="time" 
                  value={formData.lunch_end_time} 
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    lunch_end_time: e.target.value
                  }))} 
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This time period will be blocked from school scheduling
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input id="max_participants" type="number" min="1" value={formData.max_participants} onChange={e => setFormData(prev => ({
              ...prev,
              max_participants: e.target.value
            }))} placeholder="Maximum number of participants" />
            </div>
            <div>
              <Label htmlFor="fee">Event Fee</Label>
              <Input id="fee" type="number" step="0.01" min="0" value={formData.fee} onChange={e => setFormData(prev => ({
              ...prev,
              fee: e.target.value
            }))} placeholder="0.00" />
            </div>
          </div>

          <div>
            <Label>Judges</Label>
            <div className="space-y-2">
              <Select onValueChange={addJudge}>
                <SelectTrigger>
                  <SelectValue placeholder="Add judges" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableJudges().map(judge => <SelectItem key={judge.id} value={judge.id}>
                      {judge.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              
              {getSelectedJudges().length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedJudges().map(judge => <Badge key={judge.id} variant="secondary" className="flex items-center gap-1">
                      {judge.name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeJudge(judge.id)} />
                    </Badge>)}
                </div>}
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
                  {getAvailableResources().map(user => <SelectItem key={user.id} value={user.id}>
                      {user.last_name}, {user.first_name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              
              {getSelectedResources().length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedResources().map(user => <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      {user.last_name}, {user.first_name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeResource(user.id)} />
                    </Badge>)}
                </div>}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData(prev => ({
            ...prev,
            notes: e.target.value
          }))} placeholder="Additional notes for this event" rows={3} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Event'}
            </Button>
          </div>
        </form>
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