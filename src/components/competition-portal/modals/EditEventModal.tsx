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
import { convertToUI } from '@/utils/timezoneUtils';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { useCompetitionEventTypes } from '../../competition-management/hooks/useCompetitionEventTypes';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';

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
    score_sheet: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [scoreSheets, setScoreSheets] = useState<Array<{
    id: string;
    template_name: string;
    jrotc_program: string;
  }>>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [initialFormData, setInitialFormData] = useState(formData);

  const { eventTypes, isLoading: eventTypesLoading } = useCompetitionEventTypes();
  const { timezone } = useSchoolTimezone();

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: open
  });


  // Fetch filtered score sheets when event data is available
  useEffect(() => {
    if (event && formData.event) {
      fetchFilteredScoreSheets();
    }
  }, [event, formData.event]);

  useEffect(() => {
    if (event && eventTypes.length > 0) {
      // Convert UTC times to school timezone Date objects
      const startDate = event.start_time ? toZonedTime(new Date(event.start_time), timezone) : null;
      const endDate = event.end_time ? toZonedTime(new Date(event.end_time), timezone) : null;
      const lunchStartDate = (event as any).lunch_start_time ? toZonedTime(new Date((event as any).lunch_start_time), timezone) : null;
      const lunchEndDate = (event as any).lunch_end_time ? toZonedTime(new Date((event as any).lunch_end_time), timezone) : null;
      
      // Format lunch times for display
      const lunchStartTime = lunchStartDate 
        ? `${lunchStartDate.getHours().toString().padStart(2, '0')}:${lunchStartDate.getMinutes().toString().padStart(2, '0')}`
        : '';
      const lunchEndTime = lunchEndDate 
        ? `${lunchEndDate.getHours().toString().padStart(2, '0')}:${lunchEndDate.getMinutes().toString().padStart(2, '0')}`
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
        start_date: startDate ? convertToUI(startDate, timezone, 'dateKey') : '',
        start_time_hour: startDate ? startDate.getHours().toString().padStart(2, '0') : '09',
        start_time_minute: startDate ? startDate.getMinutes().toString().padStart(2, '0') : '00',
        end_date: endDate ? convertToUI(endDate, timezone, 'dateKey') : '',
        end_time_hour: endDate ? endDate.getHours().toString().padStart(2, '0') : '10',
        end_time_minute: endDate ? endDate.getMinutes().toString().padStart(2, '0') : '00',
        lunch_start_time: lunchStartTime,
        lunch_end_time: lunchEndTime,
        max_participants: event.max_participants?.toString() || '',
        fee: (event as any).fee?.toString() || '',
        interval: (event as any).interval?.toString() || '',
        notes: event.notes || '',
        score_sheet: (event as any).score_sheet || ''
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
  }, [event, eventTypes, timezone]);

  const fetchFilteredScoreSheets = async () => {
    try {
      if (!event?.competition_id || !formData.event) {
        setScoreSheets([]);
        return;
      }
      
      // Get the competition's program to filter score sheets
      const { data: competitionData, error: competitionError } = await supabase
        .from('cp_competitions')
        .select('program')
        .eq('id', event.competition_id)
        .maybeSingle();

      if (competitionError) throw competitionError;

      if (competitionData?.program) {
        const { data, error } = await supabase
          .from('competition_templates')
          .select('id, template_name, jrotc_program')
          .eq('is_active', true)
          .eq('jrotc_program', competitionData.program)
          .eq('event', formData.event)
          .order('template_name', { ascending: true });
        
        if (error) throw error;
        setScoreSheets(data || []);
      } else {
        setScoreSheets([]);
      }
    } catch (error) {
      console.error('Error fetching filtered score sheets:', error);
      toast.error('Failed to load score sheets');
    }
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

    // Validation for date/time ordering
    const startDateTime = new Date(`${formData.start_date}T${formData.start_time_hour.padStart(2, '0')}:${formData.start_time_minute.padStart(2, '0')}:00`);
    const endDateTime = new Date(`${formData.end_date}T${formData.end_time_hour.padStart(2, '0')}:${formData.end_time_minute.padStart(2, '0')}:00`);
    
    if (endDateTime <= startDateTime) {
      toast.error('End date & time must be after start date & time');
      return;
    }

    // Validation for lunch break timing
    if (formData.lunch_start_time && formData.lunch_end_time) {
      const lunchStartDateTime = new Date(`${formData.start_date}T${formData.lunch_start_time}:00`);
      const lunchEndDateTime = new Date(`${formData.start_date}T${formData.lunch_end_time}:00`);
      
      if (lunchStartDateTime <= startDateTime) {
        toast.error('Lunch break start must be after event start time');
        return;
      }
      
      if (lunchEndDateTime >= endDateTime) {
        toast.error('Lunch break end must be before event end time');
        return;
      }
      
      if (lunchEndDateTime <= lunchStartDateTime) {
        toast.error('Lunch break end must be after lunch break start');
        return;
      }
    }

    setIsLoading(true);
    try {
      // Convert school timezone to UTC for database storage
      const startDateTime = formData.start_date && formData.start_time_hour && formData.start_time_minute
        ? fromZonedTime(
            new Date(`${formData.start_date}T${formData.start_time_hour}:${formData.start_time_minute}:00`),
            timezone
          ).toISOString()
        : null;
      
      const endDateTime = formData.end_date && formData.end_time_hour && formData.end_time_minute
        ? fromZonedTime(
            new Date(`${formData.end_date}T${formData.end_time_hour}:${formData.end_time_minute}:00`),
            timezone
          ).toISOString()
        : null;

      // Convert lunch times from school timezone to UTC using the event's start date
      const lunchStartTime = formData.lunch_start_time && formData.start_date
        ? fromZonedTime(
            new Date(`${formData.start_date}T${formData.lunch_start_time}:00`),
            timezone
          ).toISOString()
        : null;
        
      const lunchEndTime = formData.lunch_end_time && formData.start_date
        ? fromZonedTime(
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
        score_sheet: formData.score_sheet || null,
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
            <Label htmlFor="score_sheet">Score Sheet Template</Label>
            <Select value={formData.score_sheet} onValueChange={value => setFormData(prev => ({
              ...prev,
              score_sheet: value
            }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a score sheet template" />
              </SelectTrigger>
              <SelectContent>
                {scoreSheets.map(sheet => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Attachments */}
          {event && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <AttachmentSection
                recordType="cp_comp_event"
                recordId={event.id}
                canEdit={true}
                showContentOnly={true}
              />
            </div>
          )}

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