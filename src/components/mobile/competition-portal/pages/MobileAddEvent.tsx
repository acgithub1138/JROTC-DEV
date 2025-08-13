import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TimePicker } from '@/components/ui/time-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export const MobileAddEvent: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId } = useParams<{ competitionId: string }>();
  const { createEvent } = useCompetitionEvents(competitionId);
  const { timezone } = useSchoolTimezone();
  const { users: schoolUsers } = useSchoolUsers(true);
  
  const [formData, setFormData] = useState({
    event: '',
    location: '',
    start_date: new Date(),
    start_time: '08:00',
    end_date: new Date(),
    end_time: '09:00',
    lunch_start_time: '',
    lunch_end_time: '',
    max_participants: '',
    fee: '',
    interval: '15',
    notes: '',
    judges: [] as string[],
    resources: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [judges, setJudges] = useState<Array<{ id: string; name: string }>>([]);
  
  const initialData = {
    event: '',
    location: '',
    start_date: new Date(),
    start_time: '08:00',
    end_date: new Date(),
    end_time: '09:00',
    lunch_start_time: '',
    lunch_end_time: '',
    max_participants: '',
    fee: '',
    interval: '15',
    notes: '',
    judges: [] as string[],
    resources: [] as string[]
  };
  
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: formData
  });

  useEffect(() => {
    fetchEvents();
    fetchJudges();
    fetchCompetitionDate();
  }, [competitionId]);

  const fetchCompetitionDate = async () => {
    if (!competitionId) return;
    
    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('start_date, end_date')
        .eq('id', competitionId)
        .single();

      if (error) throw error;

      if (data?.start_date) {
        const startDate = new Date(data.start_date);
        const endDate = data?.end_date ? new Date(data.end_date) : startDate;
        
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
    if (!competitionId) return;
    
    try {
      const { data: allEvents, error: eventsError } = await supabase
        .from('cp_events')
        .select('id, name')
        .eq('active', true);
      
      if (eventsError) throw eventsError;

      const { data: usedEvents, error: usedError } = await supabase
        .from('cp_comp_events')
        .select('event')
        .eq('competition_id', competitionId);
      
      if (usedError) throw usedError;

      const usedEventIds = new Set(usedEvents?.map(ue => ue.event) || []);
      const availableEvents = (allEvents || []).filter(event => !usedEventIds.has(event.id));
      
      setEvents(availableEvents);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-set lunch end time when lunch start time changes
    if (field === 'lunch_start_time' && value) {
      const [hours, minutes] = value.split(':');
      const nextHour = (parseInt(hours) + 1) % 24;
      const lunchEndTime = `${String(nextHour).padStart(2, '0')}:${minutes}`;
      setFormData(prev => ({ ...prev, lunch_end_time: lunchEndTime }));
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

  const validateForm = () => {
    if (!formData.event.trim()) {
      toast.error('Please select an event');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const startDateStr = format(formData.start_date, 'yyyy-MM-dd');
      const endDateStr = format(formData.end_date, 'yyyy-MM-dd');
      
      const start_time = formData.start_time 
        ? new Date(`${startDateStr}T${formData.start_time}:00`).toISOString()
        : null;
        
      const end_time = formData.end_time 
        ? new Date(`${endDateStr}T${formData.end_time}:00`).toISOString()
        : null;
        
      const lunch_start_time = formData.lunch_start_time 
        ? new Date(`${startDateStr}T${formData.lunch_start_time}:00`).toISOString()
        : null;
        
      const lunch_end_time = formData.lunch_end_time 
        ? new Date(`${startDateStr}T${formData.lunch_end_time}:00`).toISOString()
        : null;

      const eventData: any = {
        competition_id: competitionId!,
        event: formData.event,
        location: formData.location || null,
        start_time,
        end_time,
        lunch_start_time,
        lunch_end_time,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        fee: formData.fee ? parseFloat(formData.fee) : null,
        interval: formData.interval ? parseInt(formData.interval) : null,
        notes: formData.notes || null,
        judges: formData.judges,
        resources: formData.resources
      };
      
      await createEvent(eventData);
      resetChanges();
      navigate(`/mobile/competition-portal/manage/${competitionId}/events`);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/mobile/competition-portal/manage/${competitionId}/events`);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate(`/mobile/competition-portal/manage/${competitionId}/events`);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2 h-8 w-8"
              >
                <ArrowLeft size={18} />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">
                Add Event
              </h1>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.event.trim()}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Save size={16} />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4 pb-20">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event">Event *</Label>
                <Select value={formData.event} onValueChange={(value) => handleInputChange('event', value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id} className="hover:bg-accent">
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter event location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter event notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timing & Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        onSelect={(date) => date && handleInputChange('start_date', date)}
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
                        onSelect={(date) => date && handleInputChange('end_date', date)}
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
                  onChange={(value) => handleInputChange('start_time', value)}
                />
                <TimePicker
                  id="end_time"
                  label="End Time"
                  value={formData.end_time}
                  onChange={(value) => handleInputChange('end_time', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TimePicker
                  id="lunch_start_time"
                  label="Lunch Start"
                  value={formData.lunch_start_time}
                  onChange={(value) => handleInputChange('lunch_start_time', value)}
                />
                <TimePicker
                  id="lunch_end_time"
                  label="Lunch End"
                  value={formData.lunch_end_time}
                  onChange={(value) => handleInputChange('lunch_end_time', value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', e.target.value)}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Event Fee($)</Label>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    value={formData.fee}
                    onChange={(e) => handleInputChange('fee', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Interval (min)</Label>
                  <Input
                    id="interval"
                    type="number"
                    value={formData.interval}
                    onChange={(e) => handleInputChange('interval', e.target.value)}
                    placeholder="15"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Judges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Assign Judges</Label>
                <Select onValueChange={addJudge}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select judges to assign" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {getAvailableJudges().map((judge) => (
                      <SelectItem key={judge.id} value={judge.id} className="hover:bg-accent">
                        {judge.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {getSelectedJudges().length > 0 && (
                <div className="space-y-2">
                  <Label>Assigned Judges</Label>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedJudges().map((judge) => (
                      <Badge key={judge.id} variant="secondary" className="flex items-center gap-1">
                        {judge.name}
                        <X 
                          size={14} 
                          className="cursor-pointer hover:text-destructive" 
                          onClick={() => removeJudge(judge.id)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Assign Resources</Label>
                <Select onValueChange={addResource}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select resources to assign" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {getAvailableResources().map((user) => (
                      <SelectItem key={user.id} value={user.id} className="hover:bg-accent">
                        {user.last_name}, {user.first_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {getSelectedResources().length > 0 && (
                <div className="space-y-2">
                  <Label>Assigned Resources</Label>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedResources().map((user) => (
                      <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                        {user.last_name}, {user.first_name}
                        <X 
                          size={14} 
                          className="cursor-pointer hover:text-destructive" 
                          onClick={() => removeResource(user.id)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
};