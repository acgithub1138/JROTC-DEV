import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Gavel } from 'lucide-react';
import { useCompetitionJudges } from '@/hooks/competition-portal/useCompetitionJudges';
import { useJudges } from '@/hooks/competition-portal/useJudges';
import { MultiSelectJudges } from '@/components/competition-portal/components/MultiSelectJudges';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUTC } from '@/utils/timezoneUtils';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { supabase } from '@/integrations/supabase/client';
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
    judges: allJudges,
    isLoading: judgesLoading
  } = useJudges();

  // Fetch approved judge applications for this competition
  const {
    data: approvedApplications = []
  } = useQuery({
    queryKey: ['approved-judge-applications', competitionId],
    queryFn: async () => {
      if (!competitionId) return [];
      const {
        data,
        error
      } = await supabase.from('cp_judge_competition_registrations').select('judge_id, cp_judges(*)').eq('competition_id', competitionId).eq('status', 'approved');
      if (error) throw error;
      return data || [];
    },
    enabled: !!competitionId
  });

  // Filter to only show approved judges for this competition
  const availableJudges = React.useMemo(() => {
    if (!competitionId) return allJudges;
    const approvedJudgeIds = new Set(approvedApplications.map(app => app.judge_id));
    return allJudges.filter(judge => approvedJudgeIds.has(judge.id));
  }, [allJudges, approvedApplications, competitionId]);
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
  const {
    timezone
  } = useSchoolTimezone();
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
        const startInSchoolTz = judge.start_time ? toZonedTime(new Date(judge.start_time), timezone) : null;
        const endInSchoolTz = judge.end_time ? toZonedTime(new Date(judge.end_time), timezone) : null;
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

    // Validate that all required fields are filled
    if (!data.judges || data.judges.length === 0) {
      form.setError('judges', {
        message: 'At least one judge is required'
      });
      return;
    }
    if (!data.event) {
      form.setError('event', {
        message: 'Event is required'
      });
      return;
    }
    if (!data.location || data.location.trim() === '') {
      form.setError('location', {
        message: 'Location is required'
      });
      return;
    }
    if (!data.start_time_hour || !data.start_time_minute) {
      return;
    }
    if (!data.end_time_hour || !data.end_time_minute) {
      return;
    }
    setIsSaving(true);
    try {
      // Get the event's start_time if an event is selected
      const selectedEventData = competitionEvents.find(e => e.id === data.event);
      const dateStr = selectedEventData?.start_time ? new Date(selectedEventData.start_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      // Create dates in school timezone, then convert to UTC
      const startDateInSchoolTz = new Date(`${dateStr}T${data.start_time_hour}:${data.start_time_minute}:00`);
      const endDateInSchoolTz = new Date(`${dateStr}T${data.end_time_hour}:${data.end_time_minute}:00`);
      const startTimeUTC = fromZonedTime(startDateInSchoolTz, timezone);
      const endTimeUTC = fromZonedTime(endDateInSchoolTz, timezone);
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
      navigate(`/app/competition-portal/competition-details/${competitionId}/judges/assigned`);
    } catch (error) {
      console.error('Error saving judge assignment:', error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    navigate(-1);
  };
  if (judgesLoading || eventsLoading || isEditMode && isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }
  if (availableJudges.length === 0) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-6">
        <div className="flex items-center justify-between p-6 rounded-lg bg-background/60 backdrop-blur-sm border border-primary/20 shadow-lg">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleCancel} className="flex items-center gap-2 hover:scale-105 transition-transform">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {isEditMode ? 'Edit' : 'Assign'} Judge
              </h1>
            </div>
          </div>
        </div>
        <Card className="max-w-4xl mx-auto border-primary/20 shadow-lg bg-background/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              No available judges. Please create judges and try again.
            </p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-6">
      {/* Mobile Back Button - shown above header */}
      <div className="md:hidden mb-4">
        <Button variant="outline" size="sm" onClick={handleCancel} className="flex items-center gap-2 hover:scale-105 transition-transform">
          <ArrowLeft className="h-4 w-4" />
          Back to Judges
        </Button>
      </div>

      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-6 rounded-lg bg-background/60 backdrop-blur-sm border border-primary/20 shadow-lg">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancel} className="hidden md:flex items-center gap-2 hover:scale-105 transition-transform">
            <ArrowLeft className="h-4 w-4" />
            Back to Judges
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
              <Gavel className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Judge Assignment Details
            </h1>
          </div>
        </div>
        <Button type="submit" form="judge-form" disabled={isSaving} className="hidden md:flex items-center gap-2 hover:scale-105 transition-transform">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Assign'}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Mobile action button - shown above the card */}
        <div className="md:hidden mb-4">
          <Button type="submit" form="judge-form" disabled={isSaving} className="w-full flex items-center justify-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Assign'}
          </Button>
        </div>

        <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow bg-background/80 backdrop-blur-sm">
        
        <CardContent className="pt-6 py-[8px]">
          <Form {...form}>
            <form id="judge-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 py-[8px]">
                  <FormField control={form.control} name="event" rules={{
                    required: 'Event is required'
                  }} render={({
                    field
                  }) => <FormItem>
                        <FormLabel className="font-semibold">Event *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an event" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background">
                          {competitionEvents.length === 0 ? <div className="p-2 text-sm text-muted-foreground">No events available</div> : [...competitionEvents].sort((a, b) => (a.event_name || '').localeCompare(b.event_name || '')).map(event => {
                            const judgeCount = judges.filter(j => (j as any).event === event.id).length;
                            return (
                              <SelectItem key={event.id} value={event.id}>
                                {event.event_name || 'Unnamed Event'} ({judgeCount})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
                </div>

                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20 py-[8px]">
                  <FormField control={form.control} name="location" rules={{
                    required: 'Location is required'
                  }} render={({
                    field
                  }) => <FormItem>
                        <FormLabel className="font-semibold">Location *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter location" readOnly className="bg-muted/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
                {/* Start Time */}
                <div className="flex items-center gap-2">
                  <FormLabel className="w-24 text-left shrink-0 font-semibold">Start Time *</FormLabel>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="start_time_hour" rules={{
                      required: 'Start hour is required'
                    }} render={({
                      field
                    }) => <FormItem>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Hour" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                              {Array.from({
                            length: 24
                          }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                  {i.toString().padStart(2, '0')}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="start_time_minute" rules={{
                      required: 'Start minute is required'
                    }} render={({
                      field
                    }) => <FormItem>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Min" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                              {['00', '10', '20', '30', '40', '50'].map(minute => <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>

                {/* End Time */}
                <div className="flex items-center gap-2">
                  <FormLabel className="w-24 text-left shrink-0 font-semibold">End Time *</FormLabel>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="end_time_hour" rules={{
                      required: 'End hour is required'
                    }} render={({
                      field
                    }) => <FormItem>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Hour" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                              {Array.from({
                            length: 24
                          }, (_, i) => <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                  {i.toString().padStart(2, '0')}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="end_time_minute" rules={{
                      required: 'End minute is required'
                    }} render={({
                      field
                    }) => <FormItem>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Min" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                              {['00', '10', '20', '30', '40', '50'].map(minute => <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 py-[8px]">
                <FormField control={form.control} name="judges" rules={{
                  required: 'At least one judge is required',
                  validate: value => value && value.length > 0 || 'At least one judge is required'
                }} render={({
                  field
                }) => <FormItem>
                      <FormLabel className="font-semibold">Judge{!isEditMode && 's'} *</FormLabel>
                    <FormControl>
                      <MultiSelectJudges judges={availableJudges.map(j => ({
                      id: j.id,
                      name: j.name
                    }))} selectedJudgeIds={field.value || []} onChange={field.onChange} disabled={isEditMode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 py-[8px]">
                <FormField control={form.control} name="assignment_details" render={({
                  field
                }) => <FormItem>
                      <FormLabel className="font-semibold">Assignment Details</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter any additional details about this assignment" rows={4} className="resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>


            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    </div>;
};