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
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { convertFromSchoolTimezone, convertToSchoolTimezone } from '@/utils/timezoneUtils';
import { useCompetitionEventTypes } from '../../competition-management/hooks/useCompetitionEventTypes';

type CompEvent = Database['public']['Tables']['cp_comp_events']['Row'] & {
  competition_event_types?: { name: string } | null;
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
    lunch_start_time: '',
    lunch_end_time: '',
    max_participants: '',
    fee: '',
    interval: '',
    notes: '',
    judges: [] as string[],
    resources: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [judges, setJudges] = useState<Array<{id: string, name: string}>>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [initialFormData, setInitialFormData] = useState(formData);
  
  const {
    users: schoolUsers,
    isLoading: usersLoading
  } = useSchoolUsers(true); // Only active users

  const { eventTypes, isLoading: eventTypesLoading } = useCompetitionEventTypes();
  const { timezone } = useSchoolTimezone();

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: open
  });

  useEffect(() => {
    if (open) {
      fetchJudges();
    }
  }, [open]);

  useEffect(() => {
    if (event && eventTypes.length > 0) {
      // Convert UTC times to school timezone for display
      const startDate = event.start_time ? convertToSchoolTimezone(event.start_time, timezone) : null;
      const endDate = event.end_time ? convertToSchoolTimezone(event.end_time, timezone) : null;
      
      // Parse lunch times using timezone utilities
      const lunchStartTime = (event as any).lunch_start_time 
        ? formatTimeForDisplay((event as any).lunch_start_time, TIME_FORMATS.TIME_ONLY_24H, timezone)
        : '';
      const lunchEndTime = (event as any).lunch_end_time 
        ? formatTimeForDisplay((event as any).lunch_end_time, TIME_FORMATS.TIME_ONLY_24H, timezone)
        : '';

      // Find the matching event type by name or ID
      // Since the event field now contains the competition_event_types ID directly,
      // we need to find the matching event type
      let eventTypeName = '';
      let matchingEventType = null;
      
      if (event.competition_event_types?.name) {
        // If we have the joined name from the query
        eventTypeName = event.competition_event_types.name;
        matchingEventType = eventTypes.find(et => et.name === eventTypeName);
      } else if (event.event) {
        // If we only have the UUID, find by ID
        matchingEventType = eventTypes.find(et => et.id === event.event);
        eventTypeName = matchingEventType?.name || '';
      }
      
      const newFormData = {
        event: matchingEventType?.id || '',
        location: event.location || '',
        start_date: startDate ? formatTimeForDisplay(startDate, 'yyyy-MM-dd', timezone) : '',
        start_time_hour: startDate ? startDate.getHours().toString().padStart(2, '0') : '09',
        start_time_minute: startDate ? startDate.getMinutes().toString().padStart(2, '0') : '00',
        end_date: endDate ? formatTimeForDisplay(endDate, 'yyyy-MM-dd', timezone) : '',
        end_time_hour: endDate ? endDate.getHours().toString().padStart(2, '0') : '10',
        end_time_minute: endDate ? endDate.getMinutes().toString().padStart(2, '0') : '00',
        lunch_start_time: lunchStartTime,
        lunch_end_time: lunchEndTime,
        max_participants: event.max_participants?.toString() || '',
        fee: (event as any).fee?.toString() || '',
        interval: (event as any).interval?.toString() || '',
        notes: event.notes || '',
        judges: event.judges || [],
        resources: event.resources || []
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
  }, [event, eventTypes, timezone]);

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

  // Calculate max participants when interval is set
  useEffect(() => {
    if (formData.interval && 
        formData.start_date && formData.start_time_hour && formData.start_time_minute &&
        formData.end_time_hour && formData.end_time_minute) {
      
      const startTime = new Date(`${formData.start_date}T${formData.start_time_hour.padStart(2, '0')}:${formData.start_time_minute.padStart(2, '0')}:00`);
      const endTime = new Date(`${formData.start_date}T${formData.end_time_hour.padStart(2, '0')}:${formData.end_time_minute.padStart(2, '0')}:00`);
      
      let totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      // Subtract lunch break if defined
      if (formData.lunch_start_time && formData.lunch_end_time) {
        // Parse HH:MM format lunch times
        const lunchStartParts = formData.lunch_start_time.split(':');
        const lunchEndParts = formData.lunch_end_time.split(':');
        
        if (lunchStartParts.length === 2 && lunchEndParts.length === 2) {
          const lunchStart = new Date(`${formData.start_date}T${lunchStartParts[0].padStart(2, '0')}:${lunchStartParts[1].padStart(2, '0')}:00`);
          const lunchEnd = new Date(`${formData.start_date}T${lunchEndParts[0].padStart(2, '0')}:${lunchEndParts[1].padStart(2, '0')}:00`);
          const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
          totalMinutes -= lunchMinutes;
        }
      }
      
      const interval = parseInt(formData.interval);
      if (interval > 0 && totalMinutes > 0) {
        const maxParticipants = Math.floor(totalMinutes / interval);
        setFormData(prev => ({
          ...prev,
          max_participants: maxParticipants.toString()
        }));
      }
    }
  }, [formData.interval, formData.start_date, formData.start_time_hour, formData.start_time_minute, 
      formData.end_time_hour, formData.end_time_minute, formData.lunch_start_time, 
      formData.lunch_end_time]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event || !event) {
      toast.error('Please select an event');
      return;
    }

    setIsLoading(true);
    try {
      // Convert school timezone to UTC for database storage
      const startDateTime = formData.start_date && formData.start_time_hour && formData.start_time_minute
        ? convertFromSchoolTimezone(
            new Date(`${formData.start_date}T${formData.start_time_hour}:${formData.start_time_minute}:00`),
            timezone
          ).toISOString()
        : null;
      
      const endDateTime = formData.end_date && formData.end_time_hour && formData.end_time_minute
        ? convertFromSchoolTimezone(
            new Date(`${formData.end_date}T${formData.end_time_hour}:${formData.end_time_minute}:00`),
            timezone
          ).toISOString()
        : null;

      // Convert lunch times from school timezone to UTC using the event's start date
      const lunchStartTime = formData.lunch_start_time && formData.start_date
        ? convertFromSchoolTimezone(
            new Date(`${formData.start_date}T${formData.lunch_start_time}:00`),
            timezone
          ).toISOString()
        : null;
        
      const lunchEndTime = formData.lunch_end_time && formData.start_date
        ? convertFromSchoolTimezone(
            new Date(`${formData.start_date}T${formData.lunch_end_time}:00`),
            timezone
          ).toISOString()
        : null;

      // The event field already contains the competition_event_types UUID
      const updates: CompEventUpdate = {
        event: formData.event,
        location: formData.location || null,
        start_time: startDateTime,
        end_time: endDateTime,
        lunch_start_time: lunchStartTime,
        lunch_end_time: lunchEndTime,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        notes: formData.notes || null,
        judges: formData.judges,
        resources: formData.resources,
        fee: formData.fee ? parseFloat(formData.fee) : null,
        interval: formData.interval ? parseInt(formData.interval) : null
      } as any;

      await onEventUpdated(event.id, updates);
      
      // Reset unsaved changes and close modal directly
      resetChanges();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating event:', error);
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

  if (!event) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
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
                {eventTypes
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(eventType => (
                    <SelectItem key={eventType.id} value={eventType.id}>
                      {eventType.name}
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
            <Label>Judge Lunch Break</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Start Hour</Label>
                <Select 
                  value={formData.lunch_start_time.split(':')[0] || ''} 
                  onValueChange={(value) => {
                    const currentMinute = formData.lunch_start_time.split(':')[1] || '00';
                    const endHour = (parseInt(value) + 1) % 24;
                    setFormData(prev => ({ 
                      ...prev, 
                      lunch_start_time: `${value}:${currentMinute}`,
                      lunch_end_time: `${endHour.toString().padStart(2, '0')}:${currentMinute}`
                    }));
                  }}
                >
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
                <Label className="text-xs">Start Min</Label>
                <Select 
                  value={formData.lunch_start_time.split(':')[1] || ''} 
                  onValueChange={(value) => {
                    const currentHour = formData.lunch_start_time.split(':')[0] || '12';
                    const endHour = (parseInt(currentHour) + 1) % 24;
                    setFormData(prev => ({ 
                      ...prev, 
                      lunch_start_time: `${currentHour}:${value}`,
                      lunch_end_time: `${endHour.toString().padStart(2, '0')}:${value}`
                    }));
                  }}
                >
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
              <div>
                <Label className="text-xs">End Hour</Label>
                <Select 
                  value={formData.lunch_end_time.split(':')[0] || ''} 
                  onValueChange={(value) => {
                    const currentMinute = formData.lunch_end_time.split(':')[1] || '00';
                    setFormData(prev => ({ ...prev, lunch_end_time: `${value}:${currentMinute}` }));
                  }}
                >
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
                <Label className="text-xs">End Min</Label>
                <Select 
                  value={formData.lunch_end_time.split(':')[1] || ''} 
                  onValueChange={(value) => {
                    const currentHour = formData.lunch_end_time.split(':')[0] || '13';
                    setFormData(prev => ({ ...prev, lunch_end_time: `${currentHour}:${value}` }));
                  }}
                >
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
            <p className="text-sm text-muted-foreground mt-1">
              This time period will be blocked from school scheduling
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="interval">Interval (minutes)</Label>
              <Input
                id="interval"
                type="number"
                min="0"
                value={formData.interval}
                onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value }))}
                placeholder="0"
              />
            </div>            <div>
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
              <Label htmlFor="fee">Event Fee</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                min="0"
                value={formData.fee}
                onChange={(e) => setFormData(prev => ({ ...prev, fee: e.target.value }))}
                placeholder="0.00"
              />
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Event'}
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
    </>
  );
};