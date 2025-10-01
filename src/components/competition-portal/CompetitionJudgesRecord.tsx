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

interface JudgeFormData {
  judges: string[]; // Changed to array for multiple selection
  event: string;
  location: string;
  start_time: string;
  end_time: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<JudgeFormData>({
    defaultValues: {
      judges: [], // Changed to array
      event: '',
      location: '',
      start_time: '',
      end_time: '',
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
        form.reset({
          judges: [judge.judge], // Wrap in array for edit mode
          event: (judge as any).event || '',
          location: judge.location || '',
          start_time: judge.start_time || '',
          end_time: judge.end_time || '',
          assignment_details: judge.assignment_details || ''
        });
      }
    }
  }, [isEditMode, judgeId, judges, form]);
  const onSubmit = async (data: JudgeFormData) => {
    if (!competitionId) return;
    setIsSaving(true);
    try {
      if (isEditMode) {
        // Edit mode: update single judge
        const judgeData: any = {
          competition_id: competitionId,
          judge: data.judges[0], // Use first judge in edit mode
          event: data.event || null,
          location: data.location || null,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          assignment_details: data.assignment_details || null
        };
        await updateJudge(judgeId, judgeData);
      } else {
        // Create mode: create a record for each selected judge
        for (const judgeId of data.judges) {
          const judgeData: any = {
            competition_id: competitionId,
            judge: judgeId,
            event: data.event || null,
            location: data.location || null,
            start_time: data.start_time || null,
            end_time: data.end_time || null,
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
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
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

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="start_time" render={({
                field
              }) => <FormItem>
                      <FormLabel>Start Time (24-hour format)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          step="900"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="end_time" render={({
                field
              }) => <FormItem>
                      <FormLabel>End Time (24-hour format)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          step="900"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
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