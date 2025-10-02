import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, X, Save, Plus, CalendarIcon, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI } from '@/utils/timezoneUtils';
import { convertFromSchoolTimezone, convertToSchoolTimezone } from '@/utils/timezoneUtils';

type CompEvent = Database['public']['Tables']['cp_comp_events']['Row'] & {
  competition_event_types?: { name: string } | null;
};
type CompEventUpdate = Database['public']['Tables']['cp_comp_events']['Update'];

export const MobileEditEvent: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId, eventId } = useParams<{ competitionId: string; eventId: string }>();
  const [event, setEvent] = useState<CompEvent | null>(null);
  const [formData, setFormData] = useState({
    event: '',
    location: '',
    start_date: new Date(),
    start_time: '09:00',
    end_date: new Date(),
    end_time: '10:00',
    lunch_start_time: '',
    lunch_end_time: '',
    max_participants: '',
    fee: '',
    interval: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Array<{id: string, name: string}>>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialFormData, setInitialFormData] = useState(formData);

  const { timezone } = useSchoolTimezone();

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: true
  });

  useEffect(() => {
    fetchEvent();
    fetchEvents();
  }, [eventId]);

  useEffect(() => {
    if (event && events.length > 0) {
      const startDate = event.start_time ? convertToSchoolTimezone(event.start_time, timezone) : null;
      const endDate = event.end_time ? convertToSchoolTimezone(event.end_time, timezone) : null;
      
      const lunchStartTime = (event as any).lunch_start_time 
        ? convertToUI((event as any).lunch_start_time, timezone, 'time')
        : '';
      const lunchEndTime = (event as any).lunch_end_time 
        ? convertToUI((event as any).lunch_end_time, timezone, 'time')
        : '';

      const newFormData = {
        event: event.event || '',
        location: event.location || '',
        start_date: startDate || new Date(),
        start_time: startDate ? `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}` : '09:00',
        end_date: endDate || new Date(),
        end_time: endDate ? `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}` : '10:00',
        lunch_start_time: lunchStartTime,
        lunch_end_time: lunchEndTime,
        max_participants: event.max_participants?.toString() || '',
        fee: (event as any).fee?.toString() || '',
        interval: (event as any).interval?.toString() || '',
        notes: event.notes || ''
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
  }, [event, events, timezone]);

  // Calculate max participants when interval is set
  useEffect(() => {
    if (formData.interval && 
        formData.start_date && formData.start_time &&
        formData.end_time) {
      
      const startDateStr = format(formData.start_date, 'yyyy-MM-dd');
      const endDateStr = format(formData.end_date, 'yyyy-MM-dd');
      const startDateTime = new Date(`${startDateStr}T${formData.start_time}:00`);
      const endDateTime = new Date(`${endDateStr}T${formData.end_time}:00`);
      
      let totalMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
      
      // Subtract lunch break if defined
      if (formData.lunch_start_time && formData.lunch_end_time) {
        const lunchStart = new Date(`${startDateStr}T${formData.lunch_start_time}:00`);
        const lunchEnd = new Date(`${startDateStr}T${formData.lunch_end_time}:00`);
        const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
        totalMinutes -= lunchMinutes;
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
  }, [formData.interval, formData.start_date, formData.start_time, 
      formData.end_date, formData.end_time, formData.lunch_start_time, formData.lunch_end_time]);

  const fetchEvent = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('cp_comp_events')
        .select(`
          *,
          competition_event_types!event(name)
        `)
        .eq('id', eventId)
        .single();
        
      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_event_types')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const handleSave = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);

      // Convert times from school timezone to UTC
      const startDateStr = format(formData.start_date, 'yyyy-MM-dd');
      const endDateStr = format(formData.end_date, 'yyyy-MM-dd');
      
      const startDateTime = convertFromSchoolTimezone(
        new Date(`${startDateStr} ${formData.start_time}`),
        timezone
      );

      const endDateTime = convertFromSchoolTimezone(
        new Date(`${endDateStr} ${formData.end_time}`),
        timezone
      );

      // Convert lunch times
      let lunchStartTime = null;
      let lunchEndTime = null;
      
      if (formData.lunch_start_time && formData.start_date) {
        lunchStartTime = convertFromSchoolTimezone(
          new Date(`${startDateStr} ${formData.lunch_start_time}`),
          timezone
        );
      }
      
      if (formData.lunch_end_time && formData.start_date) {
        lunchEndTime = convertFromSchoolTimezone(
          new Date(`${startDateStr} ${formData.lunch_end_time}`),
          timezone
        );
      }

      const updates: CompEventUpdate = {
        event: formData.event,
        location: formData.location,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        lunch_start_time: lunchStartTime?.toISOString() || null,
        lunch_end_time: lunchEndTime?.toISOString() || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        fee: formData.fee ? parseFloat(formData.fee) : null,
        interval: formData.interval ? parseFloat(formData.interval) : null,
        notes: formData.notes || null
      };

      const { error } = await supabase
        .from('cp_comp_events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event updated successfully');
      resetChanges();
      navigate(`/mobile/competition-portal/manage/${competitionId}/events`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;

    try {
      setIsDeleting(true);
      
      // Delete related records first to maintain data integrity
      // Delete event schedules
      const { error: schedulesError } = await supabase
        .from('cp_event_schedules')
        .delete()
        .eq('event_id', eventId);

      if (schedulesError) {
        console.error('Error deleting event schedules:', schedulesError);
        // Continue with deletion even if schedules deletion fails
      }

      // Delete event registrations
      const { error: registrationsError } = await supabase
        .from('cp_event_registrations')
        .delete()
        .eq('event_id', eventId);

      if (registrationsError) {
        console.error('Error deleting event registrations:', registrationsError);
        // Continue with deletion even if registrations deletion fails
      }

      // Finally delete the main event record
      const { error } = await supabase
        .from('cp_comp_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event and related data deleted successfully');
      navigate(`/mobile/competition-portal/manage/${competitionId}/events`);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/mobile/competition-portal/manage/${competitionId}/events`);
    }
  };

  if (!event) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/events`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
            <p className="text-sm text-muted-foreground">{event.competition_event_types?.name || 'Event Details'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowDeleteDialog(true)} 
            disabled={isLoading || isDeleting}
            variant="destructive"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Trash2 size={16} />
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !hasUnsavedChanges}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Save size={16} />
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Event Selection */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-foreground">Event Details</h3>
            
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select 
                value={formData.event} 
                onValueChange={(value) => setFormData({ ...formData, event: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter event location"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Participants</Label>
              <Input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                placeholder="Enter maximum participants"
              />
            </div>

            <div className="space-y-2">
              <Label>Fee ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                placeholder="Enter event fee"
              />
            </div>

            <div className="space-y-2">
              <Label>Interval (minutes)</Label>
              <Input
                type="number"
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                placeholder="Time interval between participants"
              />
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-foreground">Timing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "MM/dd/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => date && setFormData({ ...formData, start_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "MM/dd/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => date && setFormData({ ...formData, end_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TimePicker
                id="start_time"
                label="Start Time"
                value={formData.start_time}
                onChange={(value) => setFormData({ ...formData, start_time: value })}
              />
              <TimePicker
                id="end_time"
                label="End Time"
                value={formData.end_time}
                onChange={(value) => setFormData({ ...formData, end_time: value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TimePicker
                id="lunch_start_time"
                label="Lunch Start"
                value={formData.lunch_start_time}
                onChange={(value) => setFormData({ ...formData, lunch_start_time: value })}
              />
              <TimePicker
                id="lunch_end_time"
                label="Lunch End"
                value={formData.lunch_end_time}
                onChange={(value) => setFormData({ ...formData, lunch_end_time: value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-foreground">Notes</h3>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any additional notes..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onCancel={() => setShowUnsavedDialog(false)}
        onDiscard={() => {
          resetChanges();
          navigate(`/mobile/competition-portal/manage/${competitionId}/events`);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};