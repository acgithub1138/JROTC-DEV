import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
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
import type { Database } from '@/integrations/supabase/types';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useJudges } from '@/hooks/competition-portal/useJudges';
import { formatInSchoolTimezone, convertFromSchoolTimezone, convertToSchoolTimezone } from '@/utils/timezoneUtils';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useCompetitionEventTypes } from '../../competition-management/hooks/useCompetitionEventTypes';
import { useCompetitionEventsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { MultiSelectJudges } from '../components/MultiSelectJudges';
import { MultiSelectResources } from '../components/MultiSelectResources';
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
  notes: string;
  score_sheet: string;
  judges: string[];
  resources: string[];
}
export const CompetitionEventRecord: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [judges, setJudges] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [scoreSheets, setScoreSheets] = useState<Array<{
    id: string;
    template_name: string;
    jrotc_program: string;
  }>>([]);
  const {
    users: schoolUsers,
    isLoading: usersLoading
  } = useSchoolUsers(true);
  const {
    timezone,
    isLoading: timezoneLoading
  } = useSchoolTimezone();
  const {
    eventTypes,
    isLoading: eventTypesLoading
  } = useCompetitionEventTypes();
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
    end_hour: '10',
    end_minute: '00',
    lunch_start_hour: '12',
    lunch_start_minute: '00',
    lunch_end_hour: '13',
    lunch_end_minute: '00',
    max_participants: '',
    fee: '',
    interval: '',
    notes: '',
    score_sheet: '',
    judges: [],
    resources: []
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
      
      // Fetch score sheets first, then set form data to ensure UUID is preserved
      if (convertedData.event && competitionId) {
        fetchFilteredScoreSheets(convertedData.event).then(() => {
          setFormData(convertedData);
        });
      } else {
        setFormData(convertedData);
      }
    }
  }, [existingEvent, isEditMode, isViewMode, eventTypes, timezone]);

  // Fetch judges and competition date on component mount
  useEffect(() => {
    fetchJudges();
    if (isCreateMode && competitionId) {
      fetchCompetitionDate();
    }
  }, [isCreateMode, competitionId]);

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
    const startDate = event.start_time ? convertToSchoolTimezone(event.start_time, timezone) : null;
    const endDate = event.end_time ? convertToSchoolTimezone(event.end_time, timezone) : null;
    const lunchStartDate = (event as any).lunch_start_time ? convertToSchoolTimezone((event as any).lunch_start_time, timezone) : null;
    const lunchEndDate = (event as any).lunch_end_time ? convertToSchoolTimezone((event as any).lunch_end_time, timezone) : null;

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
      start_date: startDate ? formatTimeForDisplay(startDate, 'yyyy-MM-dd', timezone) : '',
      start_hour: startDate ? startDate.getHours().toString().padStart(2, '0') : '09',
      start_minute: startDate ? startDate.getMinutes().toString().padStart(2, '0') : '00',
      end_date: endDate ? formatTimeForDisplay(endDate, 'yyyy-MM-dd', timezone) : '',
      end_hour: endDate ? endDate.getHours().toString().padStart(2, '0') : '10',
      end_minute: endDate ? endDate.getMinutes().toString().padStart(2, '0') : '00',
      lunch_start_hour: lunchStartDate ? lunchStartDate.getHours().toString().padStart(2, '0') : '12',
      lunch_start_minute: lunchStartDate ? lunchStartDate.getMinutes().toString().padStart(2, '0') : '00',
      lunch_end_hour: lunchEndDate ? lunchEndDate.getHours().toString().padStart(2, '0') : '13',
      lunch_end_minute: lunchEndDate ? lunchEndDate.getMinutes().toString().padStart(2, '0') : '00',
      max_participants: event.max_participants?.toString() || '',
      fee: (event as any).fee?.toString() || '',
      interval: (event as any).interval?.toString() || '',
      notes: event.notes || '',
      score_sheet: (event as any).score_sheet || '',
      judges: event.judges || [],
      resources: event.resources || []
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
      navigate(`/app/competition-portal/competition-details/${competitionId}`);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchJudges = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('cp_judges').select('id, name').eq('available', true).order('name', {
        ascending: true
      });
      if (error) throw error;
      setJudges(data || []);
    } catch (error) {
      console.error('Error fetching judges:', error);
      toast.error('Failed to load judges');
    }
  };
  const fetchCompetitionDate = async () => {
    if (!competitionId) return;
    try {
      const {
        data,
        error
      } = await supabase.from('cp_competitions').select('start_date, end_date').eq('id', competitionId).single();
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
      if (competitionData?.program) {
        const {
          data,
          error
        } = await supabase.from('competition_templates').select('id, template_name, jrotc_program').eq('is_active', true).eq('jrotc_program', competitionData.program).eq('event', eventToUse).order('template_name', {
          ascending: true
        });
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
  const combineDateTime = (date: string, hour: string, minute: string): string | null => {
    if (!date || !hour || !minute || !timezone) return null;
    const schoolDateTime = new Date(`${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`);
    const utcDateTime = convertFromSchoolTimezone(schoolDateTime, timezone);
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
        notes: formData.notes || null,
        score_sheet: formData.score_sheet || null,
        judges: formData.judges,
        resources: formData.resources
      };
      if (isCreateMode) {
        const {
          error
        } = await supabase.from('cp_comp_events').insert({
          ...eventData,
          school_id: undefined,
          // Let database handle this via auth context
          created_by: undefined // Let database handle this via auth context
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
      resetChanges();
      navigate(`/app/competition-portal/competition-details/${competitionId}`);
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
      navigate(`/app/competition-portal/competition-details/${competitionId}`);
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
      navigate(`/app/competition-portal/competition-details/${competitionId}`);
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
    return schoolUsers.filter(user => !formData.resources.includes(user.id)).sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
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
  return <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canEditForm && (
            <>
              <Button type="button" variant="outline" onClick={handleBack} disabled={isSaving}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="event-form"
                disabled={isSaving} 
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : isCreateMode ? 'Create Event' : 'Save Changes'}
              </Button>
            </>
          )}
          {isEditMode && canDelete && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Event
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Event & Score Template */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="event" className="text-right">Event *</Label>
                <Select value={formData.event} onValueChange={value => setFormData(prev => ({
                ...prev,
                event: value
              }))} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.sort((a, b) => a.name.localeCompare(b.name)).map(eventType => <SelectItem key={eventType.id} value={eventType.id}>
                          {eventType.name}
                        </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="score_sheet" className="text-right">Score Template *</Label>
                <Select value={formData.score_sheet} onValueChange={value => setFormData(prev => ({
                ...prev,
                score_sheet: value
              }))} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a score template" />
                  </SelectTrigger>
                  <SelectContent>
                    {scoreSheets.map(sheet => <SelectItem key={sheet.id} value={sheet.id}>
                        {sheet.template_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fee & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="fee" className="text-right">Fee *</Label>
                <Input id="fee" type="number" step="0.01" value={formData.fee} onChange={e => setFormData(prev => ({
                ...prev,
                fee: e.target.value
              }))} placeholder="Event fee" disabled={isViewMode} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="location" className="text-right">Location *</Label>
                <Input id="location" value={formData.location} onChange={e => setFormData(prev => ({
                ...prev,
                location: e.target.value
              }))} placeholder="Event location" disabled={isViewMode} required />
              </div>
            </div>

            {/* Judge & Resource Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label className="text-right">Judges</Label>
                <MultiSelectJudges
                  judges={judges}
                  selectedJudgeIds={formData.judges}
                  onChange={(judgeIds) => setFormData(prev => ({ ...prev, judges: judgeIds }))}
                  disabled={isViewMode}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label className="text-right">Resources</Label>
                <MultiSelectResources
                  resources={schoolUsers}
                  selectedResourceIds={formData.resources}
                  onChange={(resourceIds) => setFormData(prev => ({ ...prev, resources: resourceIds }))}
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Interval & Max Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="interval" className="text-right">Interval (minutes) *</Label>
                <Input id="interval" type="number" value={formData.interval} onChange={e => setFormData(prev => ({
                ...prev,
                interval: e.target.value
              }))} placeholder="Interval in minutes" disabled={isViewMode} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="max_participants" className="text-right">Max Participants *</Label>
                <Input id="max_participants" type="number" value={formData.max_participants} onChange={e => setFormData(prev => ({
                ...prev,
                max_participants: e.target.value
              }))} placeholder="Maximum participants" disabled={isViewMode} required />
              </div>
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
              <Label className="text-right">Start Date & Time *</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-2">
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

            {/* End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
              <Label className="text-right">End Date & Time *</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-2">
                  <Input type="date" value={formData.end_date} onChange={e => setFormData(prev => ({
                  ...prev,
                  end_date: e.target.value
                }))} disabled={isViewMode} required />
                </div>
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

            {/* Lunch Break */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
              <Label className="text-right">Lunch Break *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Start Time</Label>
                  <div className="flex gap-2">
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
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">End Time</Label>
                  <div className="flex gap-2">
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



            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
              <Label htmlFor="notes" className="mt-2 text-right">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={e => setFormData(prev => ({
              ...prev,
              notes: e.target.value
            }))} placeholder="Additional notes about the event" disabled={isViewMode} rows={3} />
            </div>


          </form>
        </CardContent>
      </Card>

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
      navigate(`/app/competition-portal/competition-details/${competitionId}`);
    }} onCancel={() => setShowUnsavedDialog(false)} />
    </div>;
};