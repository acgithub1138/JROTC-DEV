import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useCompetitionJudges } from '@/hooks/competition-portal/useCompetitionJudges';
import { useJudges } from '@/hooks/competition-portal/useJudges';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertFromSchoolTimezone, convertToSchoolTimezone } from '@/utils/timezoneUtils';

interface JudgeFormData {
  judges: string[];
  event: string;
  location: string;
  start_time_hour: string;
  start_time_minute: string;
  end_time_hour: string;
  end_time_minute: string;
  assignment_details: string;
}
export const CompetitionJudgesRecord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract competition ID from pathname since route isn't parameterized
  const competitionId = React.useMemo(() => {
    const match = location.pathname.match(/\/competition-details\/([^\/]+)\/judges_record/);
    return match?.[1] || null;
  }, [location.pathname]);
  const judgeId = location.state?.judgeId;
  const isEditMode = !!judgeId;
  const {
    judges: availableJudges,
    isLoading: judgesLoading
  } = useJudges();
  const {
    judges,
    createJudge,
    updateJudge,
    isLoading
  } = useCompetitionJudges(competitionId);
  const {
    events: competitionEvents,
    isLoading: eventsLoading
  } = useCompetitionEvents(competitionId);
  const { timezone } = useSchoolTimezone();
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<JudgeFormData>({
    defaultValues: {
      judges: [],
      event: '',
      location: '',
      start_time_hour: '09',
      start_time_minute: '00',
      end_time_hour: '17',
      end_time_minute: '00',
      assignment_details: ''
    }
  });

  // Watch event field to auto-fill location
  const selectedEvent = form.watch('event');
  useEffect(() => {
    if (selectedEvent) {
      const event = competitionEvents.find(e => e.id === selectedEvent);
      if (event?.location) {
        form.setValue('location', event.location);
      }
    }
  }, [selectedEvent, competitionEvents, form]);
  useEffect(() => {
    if (isEditMode && judges.length > 0) {
      const judge = judges.find(j => j.id === judgeId);
      if (judge) {
        // Convert UTC times to school timezone for editing
        const startInSchoolTz = judge.start_time ? convertToSchoolTimezone(new Date(judge.start_time), timezone) : null;
        const endInSchoolTz = judge.end_time ? convertToSchoolTimezone(new Date(judge.end_time), timezone) : null;
        
        const startHour = startInSchoolTz ? startInSchoolTz.getHours().toString().padStart(2, '0') : '09';
        const startMinute = startInSchoolTz ? startInSchoolTz.getMinutes().toString().padStart(2, '0') : '00';
        const endHour = endInSchoolTz ? endInSchoolTz.getHours().toString().padStart(2, '0') : '17';
        const endMinute = endInSchoolTz ? endInSchoolTz.getMinutes().toString().padStart(2, '0') : '00';
        
        form.reset({
          judges: [judge.judge],
          event: (judge as any).event || '',
          location: judge.location || '',
          start_time_hour: startHour,
          start_time_minute: startMinute,
          end_time_hour: endHour,
          end_time_minute: endMinute,
          assignment_details: judge.assignment_details || ''
        });
      }
    }
  }, [isEditMode, judgeId, judges, form, timezone]);
  const onSubmit = async (data: JudgeFormData) => {
    if (!competitionId) return;
    setIsSaving(true);
    try {
      // Get the event's start_time if an event is selected
      const selectedEventData = competitionEvents.find(e => e.id === data.event);
      const dateStr = selectedEventData?.start_time 
        ? new Date(selectedEventData.start_time).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      // Create dates in school timezone, then convert to UTC
      const startDateInSchoolTz = new Date(`${dateStr}T${data.start_time_hour}:${data.start_time_minute}:00`);
      const endDateInSchoolTz = new Date(`${dateStr}T${data.end_time_hour}:${data.end_time_minute}:00`);
      
      const startTimeUTC = convertFromSchoolTimezone(startDateInSchoolTz, timezone);
      const endTimeUTC = convertFromSchoolTimezone(endDateInSchoolTz, timezone);
      
      const startTime = startTimeUTC.toISOString();
      const endTime = endTimeUTC.toISOString();
      
      if (isEditMode) {
        // Edit mode: update single judge
        const judgeData: any = {
          competition_id: competitionId,
          judge: data.judges[0],
          event: data.event || null,
          location: data.location || null,
          start_time: startTime,
          end_time: endTime,
          assignment_details: data.assignment_details || null
        };
        await updateJudge(judgeId, judgeData);
      } else {
        // Create mode: create a record for each selected judge
        for (const selectedJudgeId of data.judges) {
          const judgeData: any = {
            competition_id: competitionId,
            judge: selectedJudgeId,
            event: data.event || null,
            location: data.location || null,
            start_time: startTime,
            end_time: endTime,
            assignment_details: data.assignment_details || null
          };
          await createJudge(judgeData);
        }
      }
      navigate(`/app/competition-portal/competition-details/${competitionId}/judges`);
    } catch (error) {
      console.error('Error saving judge assignment:', error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/judges`);
  };
  if (judgesLoading || eventsLoading || (isEditMode && isLoading)) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }
  if (availableJudges.length === 0) {
    return <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Edit' : 'Assign'} Judge
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              No available judges. Please create judges and try again.
            </p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Judges
        </Button>
        
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Judge Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="judges" rules={{
              required: 'At least one judge is required',
              validate: (value) => value && value.length > 0 || 'At least one judge is required'
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel>Judge{!isEditMode && 's'}</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => {
                          if (isEditMode) {
                            // Edit mode: single selection
                            field.onChange([value]);
                          } else {
                            // Create mode: toggle selection
                            const current = field.value || [];
                            if (current.includes(value)) {
                              field.onChange(current.filter(id => id !== value));
                            } else {
                              field.onChange([...current, value]);
                            }
                          }
                        }} 
                        value={field.value?.[0] || ''}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isEditMode ? "Select a judge" : `${field.value?.length || 0} judge(s) selected`} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableJudges.map(judge => {
                            const isSelected = field.value?.includes(judge.id);
                            return (
                              <SelectItem 
                                key={judge.id} 
                                value={judge.id}
                                className={isSelected && !isEditMode ? 'bg-accent' : ''}
                              >
                                {isSelected && !isEditMode && '✓ '}
                                {judge.name} {!judge.available && '(Unavailable)'}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {!isEditMode && field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map(judgeId => {
                          const judge = availableJudges.find(j => j.id === judgeId);
                          return judge ? (
                            <Badge key={judgeId} variant="secondary" className="text-sm">
                              {judge.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="event" render={({
              field
            }) => <FormItem>
                    <FormLabel>Event</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        {competitionEvents.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No events available</div>
                        ) : (
                          competitionEvents.map(event => <SelectItem key={event.id} value={event.id}>
                            {event.event_name || 'Unnamed Event'}
                          </SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="location" render={({
              field
            }) => <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <div className="space-y-4">
                {/* Start Time */}
                <div className="flex items-center gap-2">
                  <FormLabel className="w-24 text-left shrink-0">Start Time</FormLabel>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="start_time_hour"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="start_time_minute"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                            {['00', '10', '20', '30', '40', '50'].map((minute) => (
                              <SelectItem key={minute} value={minute}>
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* End Time */}
                <div className="flex items-center gap-2">
                  <FormLabel className="w-24 text-left shrink-0">End Time</FormLabel>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="end_time_hour"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_time_minute"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                            {['00', '10', '20', '30', '40', '50'].map((minute) => (
                              <SelectItem key={minute} value={minute}>
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField control={form.control} name="assignment_details" render={({
              field
            }) => <FormItem>
                    <FormLabel>Assignment Details</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter any additional details about this assignment" rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <div className="flex gap-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Assign'} Judge
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>;
};