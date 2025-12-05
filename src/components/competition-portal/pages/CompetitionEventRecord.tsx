import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useJudges } from '@/hooks/competition-portal/useJudges';
import { convertToUI } from '@/utils/timezoneUtils';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useCompetitionEventTypes } from '../../competition-management/hooks/useCompetitionEventTypes';
import { useCompetitionEventsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useEventsWithTemplates } from '@/hooks/competition-portal/useEventsWithTemplates';
import { MultiSelectJudges } from '../components/MultiSelectJudges';
import { MultiSelectResources } from '../components/MultiSelectResources';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
type CompEvent = Database['public']['Tables']['cp_comp_events']['Row'] & {
  competition_event_types?: {
    name: string;
  } | null;
};
type CompEventInsert = Database['public']['Tables']['cp_comp_events']['Insert'];
type CompEventUpdate = Database['public']['Tables']['cp_comp_events']['Update'];
interface FormData {
  event: string;
  location: string;
  start_date: string;
  start_hour: string;
  start_minute: string;
  end_date: string;
  end_hour: string;
  end_minute: string;
  lunch_start_hour: string;
  lunch_start_minute: string;
  lunch_end_hour: string;
  lunch_end_minute: string;
  max_participants: string;
  fee: string;
  interval: string;
  judges_needed: string;
  notes: string;
  score_sheet: string;
}
export const CompetitionEventRecord: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    userProfile
  } = useAuth();
  const queryClient = useQueryClient();

  // Extract competition ID from pathname since route isn't parameterized
  const competitionId = React.useMemo(() => {
    const match = location.pathname.match(/\/competition-details\/([^\/]+)\/events_record/);
    return match?.[1] || null;
  }, [location.pathname]);
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const mode = searchParams.get('mode') as 'create' | 'edit' | 'view' || 'create';
  const [existingEvent, setExistingEvent] = useState<CompEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [competitionProgram, setCompetitionProgram] = useState<string | null>(null);
  const [scoreSheets, setScoreSheets] = useState<Array<{
    id: string;
    template_name: string;
    jrotc_program: string;
  }>>([]);
  const [existingCompEventIds, setExistingCompEventIds] = useState<string[]>([]);
  const {
    timezone,
    isLoading: timezoneLoading
  } = useSchoolTimezone();
  const {
    eventTypes,
    isLoading: eventTypesLoading
  } = useCompetitionEventTypes();
  const {
    events: eventsWithTemplates,
    isLoading: eventsWithTemplatesLoading
  } = useEventsWithTemplates(competitionProgram || undefined);
  const {
    canCreate,
    canEdit,
    canDelete
  } = useCompetitionEventsPermissions();
  const initialFormData: FormData = {
    event: '',
    location: '',
    start_date: '',
    start_hour: '09',
    start_minute: '00',
    end_date: '',
    end_hour: '15',
    end_minute: '00',
    lunch_start_hour: '12',
    lunch_start_minute: '00',
    lunch_end_hour: '13',
    lunch_end_minute: '00',
    max_participants: '',
    fee: '',
    interval: '',
    judges_needed: '',
    notes: '',
    score_sheet: ''
  };
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData: mode === 'create' ? initialFormData : existingEvent ? convertEventToFormData(existingEvent) : initialFormData,
    currentData: formData,
    enabled: mode !== 'view'
  });
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  // Filter out events that are already added to the competition
  const availableEvents = React.useMemo(() => {
    let events = eventsWithTemplates;
    
    if (isEditMode && existingEvent) {
      // In edit mode, ensure the current event is included even if it doesn't have a template
      const currentEventId = existingEvent.event;
      const isCurrentEventInList = eventsWithTemplates.some(e => e.id === currentEventId);
      
      if (!isCurrentEventInList && currentEventId) {
        // Find the event type from eventTypes and add it
        const currentEventType = eventTypes.find(et => et.id === currentEventId);
        if (currentEventType) {
          events = [
            { id: currentEventType.id, name: currentEventType.name, jrotc_program: competitionProgram || '' },
            ...eventsWithTemplates
          ];
        }
      }
    } else {
      // In create mode, exclude events that are already added
      events = eventsWithTemplates.filter(event => !existingCompEventIds.includes(event.id));
    }
    
    return events;
  }, [eventsWithTemplates, existingCompEventIds, isEditMode, existingEvent, eventTypes, competitionProgram]);

  // Fetch existing event data for edit/view modes
  useEffect(() => {
    if ((isEditMode || isViewMode) && eventId && competitionId) {
      fetchEventData();
    }
  }, [eventId, competitionId, isEditMode, isViewMode]);

  // Initialize form data when existing event is loaded
  useEffect(() => {
    if (existingEvent && (isEditMode || isViewMode) && eventTypes.length > 0) {
      const convertedData = convertEventToFormData(existingEvent);

      // Fetch score sheets first for proper template loading, then set form data
      if (convertedData.event && competitionId) {
        const loadData = async () => {
          await fetchFilteredScoreSheets(convertedData.event);
          // Small delay to ensure React state is updated
          setTimeout(() => {
            setFormData(convertedData);
          }, 50);
        };
        loadData();
      } else {
        setFormData(convertedData);
      }
    }
  }, [existingEvent, isEditMode, isViewMode, eventTypes, timezone]);

  // Fetch competition program and date on component mount
  useEffect(() => {
    if (competitionId) {
      fetchCompetitionProgram();
      fetchExistingCompEvents();
    }
    if (isCreateMode && competitionId && !timezoneLoading && timezone) {
      fetchCompetitionDate();
    }
  }, [isCreateMode, competitionId, timezoneLoading, timezone]);

  // Fetch filtered score sheets when event changes
  useEffect(() => {
    if (formData.event && competitionId) {
      fetchFilteredScoreSheets(formData.event);
    }
  }, [formData.event, competitionId]);

  // Calculate max participants when interval is set
  useEffect(() => {
    if (formData.interval && formData.start_date && formData.start_hour && formData.start_minute && formData.end_hour && formData.end_minute) {
      const startTime = new Date(`${formData.start_date}T${formData.start_hour.padStart(2, '0')}:${formData.start_minute.padStart(2, '0')}:00`);
      const endTime = new Date(`${formData.start_date}T${formData.end_hour.padStart(2, '0')}:${formData.end_minute.padStart(2, '0')}:00`);
      let totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

      // Subtract lunch break if defined
      if (formData.lunch_start_hour && formData.lunch_start_minute && formData.lunch_end_hour && formData.lunch_end_minute) {
        const lunchStart = new Date(`${formData.start_date}T${formData.lunch_start_hour.padStart(2, '0')}:${formData.lunch_start_minute.padStart(2, '0')}:00`);
        const lunchEnd = new Date(`${formData.start_date}T${formData.lunch_end_hour.padStart(2, '0')}:${formData.lunch_end_minute.padStart(2, '0')}:00`);
        const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
        totalMinutes -= lunchMinutes;
      }
      const interval = parseInt(formData.interval);
      if (interval > 0 && totalMinutes > 0) {
        const maxParticipants = Math.floor(totalMinutes / interval);
        // Only update if the calculated value is different from current value
        if (formData.max_participants !== maxParticipants.toString()) {
          setFormData(prev => ({
            ...prev,
            max_participants: maxParticipants.toString()
          }));
        }
      }
    }
  }, [formData.interval, formData.start_date, formData.start_hour, formData.start_minute, formData.end_hour, formData.end_minute, formData.lunch_start_hour, formData.lunch_start_minute, formData.lunch_end_hour, formData.lunch_end_minute, formData.max_participants]);
  function convertEventToFormData(event: CompEvent): FormData {
    // Convert UTC times to school timezone Date objects
    const startDate = event.start_time ? toZonedTime(new Date(event.start_time), timezone) : null;
    const endDate = event.end_time ? toZonedTime(new Date(event.end_time), timezone) : null;
    const lunchStartDate = (event as any).lunch_start_time ? toZonedTime(new Date((event as any).lunch_start_time), timezone) : null;
    const lunchEndDate = (event as any).lunch_end_time ? toZonedTime(new Date((event as any).lunch_end_time), timezone) : null;

    // Find the matching event type by name or ID
    let matchingEventType = null;
    if (event.competition_event_types?.name) {
      matchingEventType = eventTypes.find(et => et.name === event.competition_event_types!.name);
    } else if (event.event) {
      matchingEventType = eventTypes.find(et => et.id === event.event);
    }
    return {
      event: matchingEventType?.id || '',
      location: event.location || '',
      start_date: startDate ? convertToUI(startDate, timezone, 'dateKey') : '',
      start_hour: startDate ? startDate.getHours().toString().padStart(2, '0') : '09',
      start_minute: startDate ? startDate.getMinutes().toString().padStart(2, '0') : '00',
      end_date: endDate ? convertToUI(endDate, timezone, 'dateKey') : '',
      end_hour: endDate ? endDate.getHours().toString().padStart(2, '0') : '10',
      end_minute: endDate ? endDate.getMinutes().toString().padStart(2, '0') : '00',
      lunch_start_hour: lunchStartDate ? lunchStartDate.getHours().toString().padStart(2, '0') : '12',
      lunch_start_minute: lunchStartDate ? lunchStartDate.getMinutes().toString().padStart(2, '0') : '00',
      lunch_end_hour: lunchEndDate ? lunchEndDate.getHours().toString().padStart(2, '0') : '13',
      lunch_end_minute: lunchEndDate ? lunchEndDate.getMinutes().toString().padStart(2, '0') : '00',
      max_participants: event.max_participants?.toString() || '',
      fee: (event as any).fee?.toString() || '',
      interval: (event as any).interval?.toString() || '',
      judges_needed: (event as any).judges_needed?.toString() || '',
      notes: event.notes || '',
      score_sheet: (event as any).score_sheet || ''
    };
  }
  const fetchEventData = async () => {
    if (!eventId || !competitionId) return;
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('cp_comp_events').select(`
          *,
          competition_event_types:event(name)
        `).eq('id', eventId).eq('competition_id', competitionId).single();
      if (error) throw error;
      setExistingEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event data');
      navigate(`/app/competition-portal/competition-details/${competitionId}/events`);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchCompetitionProgram = async () => {
    if (!competitionId) return;
    try {
      const {
        data,
        error
      } = await supabase.from('cp_competitions').select('program').eq('id', competitionId).single();
      if (error) throw error;
      setCompetitionProgram(data?.program || null);
    } catch (error) {
      console.error('Error fetching competition program:', error);
    }
  };
  const fetchExistingCompEvents = async () => {
    if (!competitionId) return;
    try {
      const {
        data,
        error
      } = await supabase.from('cp_comp_events').select('event').eq('competition_id', competitionId);
      if (error) throw error;
      const eventIds = data?.map(e => e.event).filter(Boolean) as string[];
      setExistingCompEventIds(eventIds);
    } catch (error) {
      console.error('Error fetching existing competition events:', error);
    }
  };
  const fetchCompetitionDate = async () => {
    if (!competitionId || !timezone) return;
    try {
      const {
        data,
        error
      } = await supabase.from('cp_competitions').select('start_date, end_date').eq('id', competitionId).single();
      if (error) throw error;
      if (data?.start_date) {
        const startDate = formatInTimeZone(new Date(data.start_date), timezone, 'yyyy-MM-dd');
        const endDate = data?.end_date ? formatInTimeZone(new Date(data.end_date), timezone, 'yyyy-MM-dd') : startDate;
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
  const fetchFilteredScoreSheets = async (eventId?: string) => {
    const eventToUse = eventId || formData.event;
    if (!eventToUse || !competitionId) {
      setScoreSheets([]);
      return;
    }
    try {
      const {
        data: competitionData,
        error: competitionError
      } = await supabase.from('cp_competitions').select('program').eq('id', competitionId).maybeSingle();
      if (competitionError) throw competitionError;
      
      let sheets: Array<{ id: string; template_name: string; jrotc_program: string }> = [];
      
      if (competitionData?.program) {
        const {
          data,
          error
        } = await supabase.from('competition_templates').select('id, template_name, jrotc_program').eq('is_active', true).eq('jrotc_program', competitionData.program).eq('event', eventToUse).order('template_name', {
          ascending: true
        });
        if (error) throw error;
        sheets = data || [];
      }
      
      // In edit mode, ensure the existing score sheet is included even if it doesn't match filters
      if (isEditMode && existingEvent?.score_sheet) {
        const existingSheetId = (existingEvent as any).score_sheet;
        const isExistingInList = sheets.some(s => s.id === existingSheetId);
        
        if (!isExistingInList) {
          const { data: existingSheet } = await supabase
            .from('competition_templates')
            .select('id, template_name, jrotc_program')
            .eq('id', existingSheetId)
            .single();
          
          if (existingSheet) {
            sheets = [existingSheet, ...sheets];
          }
        }
      }
      
      setScoreSheets(sheets);
    } catch (error) {
      console.error('Error fetching filtered score sheets:', error);
      toast.error('Failed to load score sheets');
    }
  };
  const combineDateTime = (date: string, hour: string, minute: string): string | null => {
    if (!date || !hour || !minute || !timezone) return null;
    const schoolDateTime = new Date(`${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`);
    const utcDateTime = fromZonedTime(schoolDateTime, timezone);
    return utcDateTime.toISOString();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for mandatory fields
    if (!formData.event) {
      toast.error('Please select an event');
      return;
    }
    if (!formData.location) {
      toast.error('Please enter a location');
      return;
    }
    if (!formData.start_date) {
      toast.error('Please select a start date');
      return;
    }
    if (!formData.end_date) {
      toast.error('Please select an end date');
      return;
    }
    if (!formData.lunch_start_hour || !formData.lunch_end_hour) {
      toast.error('Please set lunch break times');
      return;
    }
    if (!formData.interval) {
      toast.error('Please enter an interval');
      return;
    }
    if (!formData.max_participants) {
      toast.error('Please enter max participants');
      return;
    }
    if (!formData.fee) {
      toast.error('Please enter an event fee');
      return;
    }
    if (!formData.score_sheet) {
      toast.error('Please select a score template');
      return;
    }

    // Validation for date/time ordering
    const startDateTime = new Date(`${formData.start_date}T${formData.start_hour.padStart(2, '0')}:${formData.start_minute.padStart(2, '0')}:00`);
    const endDateTime = new Date(`${formData.end_date}T${formData.end_hour.padStart(2, '0')}:${formData.end_minute.padStart(2, '0')}:00`);
    if (endDateTime <= startDateTime) {
      toast.error('End date & time must be after start date & time');
      return;
    }

    // Validation for lunch break timing
    if (formData.lunch_start_hour && formData.lunch_start_minute && formData.lunch_end_hour && formData.lunch_end_minute) {
      const lunchStartDateTime = new Date(`${formData.start_date}T${formData.lunch_start_hour.padStart(2, '0')}:${formData.lunch_start_minute.padStart(2, '0')}:00`);
      const lunchEndDateTime = new Date(`${formData.start_date}T${formData.lunch_end_hour.padStart(2, '0')}:${formData.lunch_end_minute.padStart(2, '0')}:00`);
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
    setIsSaving(true);
    try {
      const start_time = combineDateTime(formData.start_date, formData.start_hour, formData.start_minute);
      const end_time = combineDateTime(formData.end_date, formData.end_hour, formData.end_minute);
      const lunch_start_time = combineDateTime(formData.start_date, formData.lunch_start_hour, formData.lunch_start_minute);
      const lunch_end_time = combineDateTime(formData.start_date, formData.lunch_end_hour, formData.lunch_end_minute);
      const eventData = {
        competition_id: competitionId,
        event: formData.event,
        location: formData.location || null,
        start_time: start_time || null,
        end_time: end_time || null,
        lunch_start_time: lunch_start_time,
        lunch_end_time: lunch_end_time,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        fee: formData.fee ? parseFloat(formData.fee) : null,
        interval: formData.interval ? parseInt(formData.interval) : null,
        judges_needed: formData.judges_needed ? parseInt(formData.judges_needed) : null,
        notes: formData.notes || null,
        score_sheet: formData.score_sheet || null
      };
      if (isCreateMode) {
        const {
          error
        } = await supabase.from('cp_comp_events').insert({
          ...eventData,
          school_id: userProfile?.school_id,
          created_by: userProfile?.id
        });
        if (error) throw error;
        toast.success('Event created successfully');
      } else if (isEditMode && eventId) {
        const {
          error
        } = await supabase.from('cp_comp_events').update(eventData).eq('id', eventId);
        if (error) throw error;
        toast.success('Event updated successfully');
      }

      // Invalidate and refetch the events list before navigating
      await queryClient.invalidateQueries({
        queryKey: ['competition-events', competitionId, userProfile?.school_id]
      });
      await queryClient.refetchQueries({
        queryKey: ['competition-events', competitionId, userProfile?.school_id]
      });
      resetChanges();
      navigate(`/app/competition-portal/competition-details/${competitionId}/events`);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!eventId) return;
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('cp_comp_events').delete().eq('id', eventId);
      if (error) throw error;
      toast.success('Event deleted successfully');

      // Invalidate and refetch the events list before navigating
      await queryClient.invalidateQueries({
        queryKey: ['competition-events', competitionId, userProfile?.school_id]
      });
      await queryClient.refetchQueries({
        queryKey: ['competition-events', competitionId, userProfile?.school_id]
      });
      navigate(`/app/competition-portal/competition-details/${competitionId}/events`);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsSaving(false);
      setShowDeleteDialog(false);
    }
  };
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/app/competition-portal/competition-details/${competitionId}/events`);
    }
  };
  // Show loading state while waiting for data
  if ((isEditMode || isViewMode) && eventId && !existingEvent && isLoading) {
    return <div className="p-6 space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>;
  }
  const pageTitle = isCreateMode ? 'Add Competition Event' : isEditMode ? 'Edit Competition Event' : 'View Competition Event';
  const canEditForm = isCreateMode && canCreate || isEditMode && canEdit;
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-6">
      {/* Mobile Back Button - shown above header */}
      <div className="md:hidden mb-4">
        <Button variant="outline" size="sm" onClick={handleBack} className="flex items-center gap-2 hover:scale-105 transition-transform">
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>
      </div>

      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-6 rounded-lg bg-background/60 backdrop-blur-sm border border-primary/20 shadow-lg">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack} className="hidden md:flex items-center gap-2 hover:scale-105 transition-transform">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {pageTitle}
            </h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {canEditForm && <>
              {isEditMode && canDelete && <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="flex items-center gap-2 hover:scale-105 transition-transform">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>}
              <Button type="submit" form="event-form" disabled={isSaving} className="flex items-center gap-2 hover:scale-105 transition-transform">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : isCreateMode ? 'Create Event' : 'Save'}
              </Button>
            </>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Mobile action buttons - shown above the card */}
        <div className="md:hidden grid grid-cols-2 gap-2 mb-4">
          {canEditForm && <>
              {isEditMode && canDelete && <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>}
              <Button type="submit" form="event-form" disabled={isSaving} className="flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : isCreateMode ? 'Create Event' : 'Save'}
              </Button>
            </>}
        </div>

        <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow bg-background/80 backdrop-blur-sm">
          
        <CardContent className="pt-6">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Event & Score Template */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="event" className="text-left md:text-right font-semibold">Event *</Label>
                <Select value={formData.event} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  event: value
                }))} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000] bg-background">
                    {availableEvents.map(event => <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="score_sheet" className="text-left md:text-right font-semibold">Score Template *</Label>
                <Select value={formData.score_sheet} onValueChange={async value => {
                  setFormData(prev => ({
                    ...prev,
                    score_sheet: value
                  }));

                  // Auto-fill judges_needed from template
                  const {
                    data: template
                  } = await supabase.from('competition_templates').select('judges').eq('id', value).single();
                  if (template?.judges) {
                    setFormData(prev => ({
                      ...prev,
                      judges_needed: template.judges.toString()
                    }));
                  }
                }} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a score template" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000] bg-background">
                    {scoreSheets.map(sheet => <SelectItem key={sheet.id} value={sheet.id}>
                        {sheet.template_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fee & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="fee" className="text-left md:text-right font-semibold">Fee *</Label>
                <Input id="fee" type="number" step="0.01" value={formData.fee} onChange={e => setFormData(prev => ({
                  ...prev,
                  fee: e.target.value
                }))} placeholder="Event fee" disabled={isViewMode} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="location" className="text-left md:text-right font-semibold">Location *</Label>
                <Input id="location" value={formData.location} onChange={e => setFormData(prev => ({
                  ...prev,
                  location: e.target.value
                }))} placeholder="Event location" disabled={isViewMode} required />
              </div>
            </div>

            {/* Interval & Max Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="interval" className="text-left md:text-right font-semibold">Interval (minutes) *</Label>
                <Input id="interval" type="number" value={formData.interval} onChange={e => setFormData(prev => ({
                  ...prev,
                  interval: e.target.value
                }))} placeholder="Interval in minutes" disabled={isViewMode} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="max_participants" className="text-left md:text-right font-semibold">Max Participants *</Label>
                <Input id="max_participants" type="number" value={formData.max_participants} onChange={e => setFormData(prev => ({
                  ...prev,
                  max_participants: e.target.value
                }))} placeholder="Maximum participants" disabled={isViewMode} required />
              </div>
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center p-4 rounded-lg bg-primary/5 border border-primary/20 py-[8px]">
              <Label className="text-left md:text-right font-semibold">Start Date & Time *</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-1">
                  <Input type="date" value={formData.start_date} onChange={e => {
                    setFormData(prev => ({
                      ...prev,
                      start_date: e.target.value
                    }));
                    if (e.target.value && !formData.end_date) {
                      setFormData(prev => ({
                        ...prev,
                        end_date: e.target.value
                      }));
                    }
                  }} disabled={isViewMode} required />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:contents">
                  <div>
                    <Select value={formData.start_hour} onValueChange={value => {
                      setFormData(prev => ({
                        ...prev,
                        start_hour: value
                      }));
                      if (value && !formData.end_hour) {
                        const nextHour = (parseInt(value) + 1).toString().padStart(2, '0');
                        setFormData(prev => ({
                          ...prev,
                          end_hour: nextHour > '23' ? '23' : nextHour
                        }));
                      }
                    }} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
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
                    <Select value={formData.start_minute} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      start_minute: value
                    }))} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Lunch Start Time */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center p-4 rounded-lg bg-secondary/10 border border-secondary/20 py-[8px]">
              <Label className="text-left md:text-right font-semibold">Lunch Break</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-1 flex items-center justify-center">
                  <Label className="text-sm font-medium">Start Time</Label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:contents">
                  <div>
                    <Select value={formData.lunch_start_hour} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      lunch_start_hour: value
                    }))} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
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
                    <Select value={formData.lunch_start_minute} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      lunch_start_minute: value
                    }))} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Lunch End Time */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
              <Label></Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-1 flex items-center justify-center">
                  <Label className="text-sm font-medium">End Time</Label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:contents">
                  <div>
                    <Select value={formData.lunch_end_hour} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      lunch_end_hour: value
                    }))} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
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
                    <Select value={formData.lunch_end_minute} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      lunch_end_minute: value
                    }))} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center p-4 rounded-lg bg-primary/5 border border-primary/20 py-[8px]">
              <Label className="text-left md:text-right font-semibold">End Date & Time *</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-1">
                  <Input type="date" value={formData.end_date} onChange={e => setFormData(prev => ({
                    ...prev,
                    end_date: e.target.value
                  }))} disabled={isViewMode} required />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:contents">
                  <div>
                    <Select value={formData.end_hour} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      end_hour: value
                    }))} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
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
                    <Select value={formData.end_minute} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      end_minute: value
                    }))} disabled={isViewMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>




            {/* Judges Needed */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center p-4 rounded-lg bg-accent/10 border border-accent/20 mx-0 py-[8px] px-[16px]">
              <Label htmlFor="judges_needed" className="text-left md:text-right font-semibold">Judges Needed</Label>
              <Input id="judges_needed" type="number" min="0" value={formData.judges_needed} onChange={e => setFormData(prev => ({
                ...prev,
                judges_needed: e.target.value
              }))} placeholder="Number of judges needed" disabled={isViewMode} />
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
              <Label htmlFor="notes" className="mt-2 text-left md:text-right font-semibold">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={e => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))} placeholder="Additional notes about the event" disabled={isViewMode} rows={3} className="resize-none" />
            </div>

            {/* Attachments */}
            {eventId && (isEditMode || isViewMode) && <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start p-4 rounded-lg bg-secondary/10 border border-secondary/20 py-[8px]">
                <Label className="mt-2 text-left md:text-right font-semibold">Attachments</Label>
                <AttachmentSection recordType="cp_comp_event" recordId={eventId} canEdit={!isViewMode} showContentOnly={true} />
              </div>}


          </form>
        </CardContent>
        </Card>
      </div>

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
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={() => {
      setShowUnsavedDialog(false);
      navigate(`/app/competition-portal/competition-details/${competitionId}/events`);
    }} onCancel={() => setShowUnsavedDialog(false)} />
    </div>;
};