import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

interface TimeSlot {
  value: string;
  label: string;
  time: Date;
  available: boolean;
}

interface CompetitionEvent {
  id: string;
  name: string;
  description?: string;
  fee?: number;
  start_time?: string;
  end_time?: string;
  lunch_start_time?: string;
  lunch_end_time?: string;
  interval?: number;
  max_participants?: number;
}

interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  hosting_school?: string;
  fee?: number;
}

export const MobileCompetitionRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competitionId');
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Map<string, string>>(new Map());
  const [occupiedSlots, setOccupiedSlots] = useState<Map<string, Set<string>>>(new Map());
  const [occupiedLabels, setOccupiedLabels] = useState<Map<string, Map<string, string>>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [conflictEventIds, setConflictEventIds] = useState<Set<string>>(new Set());

  const fetchCompetitionData = useCallback(async () => {
    if (!competitionId) return;

    try {
      // Fetch competition details
      const { data: competitionData, error: compError } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (compError) throw compError;
      setCompetition(competitionData);

      // Fetch competition events
      const { data: eventsData, error: eventsError } = await supabase
        .from('cp_comp_events')
        .select(`
          id,
          event:cp_events(name, description),
          fee,
          start_time,
          end_time,
          lunch_start_time,
          lunch_end_time,
          interval,
          max_participants
        `)
        .eq('competition_id', competitionId);

      if (eventsError) throw eventsError;

      const formattedEvents = eventsData.map(event => ({
        id: event.id,
        name: event.event?.name || 'Unknown Event',
        description: event.event?.description,
        fee: event.fee || 0,
        start_time: event.start_time,
        end_time: event.end_time,
        lunch_start_time: event.lunch_start_time,
        lunch_end_time: event.lunch_end_time,
        interval: event.interval || 15,
        max_participants: event.max_participants
      }));

      setEvents(formattedEvents);
      await fetchOccupiedSlots(formattedEvents);
    } catch (error) {
      console.error('Error fetching competition data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load competition data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [competitionId, toast]);

  const fetchOccupiedSlots = async (competitionEvents: CompetitionEvent[]) => {
    if (!competitionId) return;

    try {
      // Fetch scheduled events with school information
      const { data: schedules, error } = await supabase
        .from('cp_event_schedules')
        .select('event_id, scheduled_time, school_id, school_name')
        .eq('competition_id', competitionId);

      if (error) throw error;

      // Fetch competition schools for better school name mapping
      const { data: compSchools, error: compErr } = await supabase
        .from('cp_comp_schools')
        .select('school_id, school_name')
        .eq('competition_id', competitionId);

      if (compErr) throw compErr;

      // Create a map of school IDs to school names
      const nameBySchool = new Map<string, string>();
      compSchools?.forEach((row: any) => {
        if (row.school_id) {
          nameBySchool.set(row.school_id, row.school_name || '');
        }
      });

      const occupied = new Map<string, Set<string>>();
      const labels = new Map<string, Map<string, string>>();
      
      schedules?.forEach((schedule: any) => {
        // Skip slots occupied by the current user's school
        if (schedule.school_id === userProfile?.school_id) return;
        
        if (!occupied.has(schedule.event_id)) {
          occupied.set(schedule.event_id, new Set());
        }
        if (!labels.has(schedule.event_id)) {
          labels.set(schedule.event_id, new Map());
        }
        
        const scheduledTime = new Date(schedule.scheduled_time).toISOString();
        occupied.get(schedule.event_id)?.add(scheduledTime);
        
        // Get the school name for this slot
        const labelName = nameBySchool.get(schedule.school_id) || schedule.school_name || 'Occupied';
        labels.get(schedule.event_id)?.set(scheduledTime, labelName);
      });

      setOccupiedSlots(occupied);
      setOccupiedLabels(labels);
    } catch (error) {
      console.error('Error fetching occupied slots:', error);
    }
  };

  const generateTimeSlots = (event: CompetitionEvent): TimeSlot[] => {
    if (!event.start_time || !event.end_time) return [];

    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    const lunchStart = event.lunch_start_time ? new Date(event.lunch_start_time) : null;
    const lunchEnd = event.lunch_end_time ? new Date(event.lunch_end_time) : null;
    const interval = event.interval || 15;
    const occupied = occupiedSlots.get(event.id) || new Set();

    const slots: TimeSlot[] = [];
    const current = new Date(startTime);

    while (current < endTime) {
      // Skip lunch time
      if (lunchStart && lunchEnd && current >= lunchStart && current < lunchEnd) {
        current.setMinutes(current.getMinutes() + interval);
        continue;
      }

      const timeString = current.toISOString();
      const isOccupied = occupied.has(timeString);

      slots.push({
        value: timeString,
        label: current.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        time: new Date(current),
        available: !isOccupied
      });

      current.setMinutes(current.getMinutes() + interval);
    }

    return slots;
  };

  const handleEventSelection = (eventId: string, checked: boolean) => {
    const newSelected = new Set(selectedEvents);
    const newTimeSlots = new Map(selectedTimeSlots);

    if (checked) {
      newSelected.add(eventId);
    } else {
      newSelected.delete(eventId);
      newTimeSlots.delete(eventId);
      // Clear any conflict highlight for this event when deselected
      setConflictEventIds(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }

    setSelectedEvents(newSelected);
    setSelectedTimeSlots(newTimeSlots);
    setHasUnsavedChanges(true);
  };

  const handleTimeSlotSelection = (eventId: string, timeSlot: string) => {
    const newTimeSlots = new Map(selectedTimeSlots);
    newTimeSlots.set(eventId, timeSlot);
    setSelectedTimeSlots(newTimeSlots);
    setHasUnsavedChanges(true);
    
    // Clear conflict highlight for this event when a new time is chosen
    setConflictEventIds(prev => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  };

  const calculateTotalCost = () => {
    let total = competition?.fee || 0;
    selectedEvents.forEach(eventId => {
      const event = events.find(e => e.id === eventId);
      if (event?.fee) {
        total += event.fee;
      }
    });
    return total;
  };

  const handleRegister = async () => {
    if (!userProfile?.school_id || !competitionId) {
      toast({
        title: 'Error',
        description: 'Missing user or competition information',
        variant: 'destructive'
      });
      return;
    }

    if (selectedEvents.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one event',
        variant: 'destructive'
      });
      return;
    }

    // Check if all selected events have time slots
    for (const eventId of selectedEvents) {
      if (!selectedTimeSlots.has(eventId)) {
        toast({
          title: 'Error',
          description: 'Please select time slots for all events',
          variant: 'destructive'
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Check if already registered for this competition
      const { data: existingRegistration, error: checkError } = await supabase
        .from('cp_comp_schools')
        .select('id, status')
        .eq('competition_id', competitionId)
        .eq('school_id', userProfile.school_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRegistration) {
        toast({
          title: 'Already Registered',
          description: 'Your school is already registered for this competition.',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      // Final availability check to prevent double-booking
      const selectedEventIds = Array.from(selectedEvents);
      const selectedPairs = selectedEventIds
        .filter((id) => selectedTimeSlots.has(id))
        .map((id) => ({ event_id: id, scheduled_time: selectedTimeSlots.get(id)! }));

      if (selectedPairs.length > 0) {
        const { data: existing, error: existingError } = await supabase
          .from('cp_event_schedules')
          .select('event_id, scheduled_time, school_id')
          .eq('competition_id', competitionId)
          .in('event_id', selectedEventIds);
        
        if (existingError) throw existingError;

        const pairSet = new Set(selectedPairs.map(p => `${p.event_id}|${new Date(p.scheduled_time).toISOString()}`));
        const conflicts = new Set<string>();
        existing?.forEach((row: any) => {
          const key = `${row.event_id}|${new Date(row.scheduled_time).toISOString()}`;
          if (pairSet.has(key) && row.school_id !== userProfile.school_id) {
            conflicts.add(row.event_id);
          }
        });

        if (conflicts.size > 0) {
          setConflictEventIds(conflicts);
          toast({
            title: 'Time Slot Unavailable',
            description: 'One or more of the time slots selected are no longer available. Please select different time slots.',
            variant: 'destructive',
          });
          // Refresh occupied slots to show updated availability
          await fetchOccupiedSlots(events);
          setIsSubmitting(false);
          return;
        }
      }

      // Register school for competition
      const { data: schoolRegistration, error: schoolError } = await supabase
        .from('cp_comp_schools')
        .insert({
          competition_id: competitionId,
          school_id: userProfile.school_id,
          total_fee: calculateTotalCost(),
          status: 'registered'
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // Register for events
      const eventRegistrations = Array.from(selectedEvents).map(eventId => ({
        competition_id: competitionId,
        event_id: eventId,
        school_id: userProfile.school_id,
        status: 'registered'
      }));

      if (eventRegistrations.length > 0) {
        const { error: eventError } = await supabase
          .from('cp_event_registrations')
          .insert(eventRegistrations);

        if (eventError) throw eventError;
      }

      // Create schedule entries
      const scheduleEntries = Array.from(selectedEvents).map(eventId => {
        const timeSlot = selectedTimeSlots.get(eventId);
        return {
          competition_id: competitionId,
          event_id: eventId,
          school_id: userProfile.school_id,
          scheduled_time: timeSlot,
          duration: 15
        };
      });

      if (scheduleEntries.length > 0) {
        const { error: scheduleError } = await supabase
          .from('cp_event_schedules')
          .insert(scheduleEntries);

        if (scheduleError) throw scheduleError;
      }

      toast({
        title: 'Success',
        description: 'Successfully registered for competition',
      });

      setHasUnsavedChanges(false);
      navigate('/mobile/competition-portal/my-competitions');
    } catch (error) {
      console.error('Error registering for competition:', error);
      toast({
        title: 'Error',
        description: 'Failed to register for competition',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/mobile/competition-portal/open');
    }
  };

  useEffect(() => {
    fetchCompetitionData();
  }, [fetchCompetitionData]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" className="mr-3 p-2" disabled>
            <ArrowLeft size={20} />
          </Button>
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-3 p-2">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Competition Not Found</h1>
        </div>
        <Alert>
          <AlertDescription>
            The requested competition could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalCost = calculateTotalCost();

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-3 p-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Register for Competition</h1>
          <p className="text-sm text-muted-foreground">{competition.name}</p>
        </div>
      </div>

      {/* Competition Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={16} />
            Competition Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-medium">{competition.name}</h3>
            <p className="text-sm text-muted-foreground">{competition.description}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>📍 {competition.location}</span>
            <span>🏫 {competition.hosting_school}</span>
          </div>
          <div className="text-sm">
            📅 {new Date(competition.start_date).toLocaleDateString()} - {new Date(competition.end_date).toLocaleDateString()}
          </div>
          {competition.fee && (
            <Badge variant="outline">Base Fee: ${competition.fee}</Badge>
          )}
        </CardContent>
      </Card>

      {/* Events Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={16} />
            Available Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <Alert>
              <AlertDescription>No events available for this competition.</AlertDescription>
            </Alert>
          ) : (
            events.map(event => {
              const isSelected = selectedEvents.has(event.id);
              const timeSlots = generateTimeSlots(event);
              const selectedTimeSlot = selectedTimeSlots.get(event.id);

              return (
                <div key={event.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleEventSelection(event.id, checked as boolean)}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{event.name}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {event.fee && (
                          <Badge variant="outline">
                            <DollarSign size={12} className="mr-1" />
                            ${event.fee}
                          </Badge>
                        )}
                        {event.max_participants && (
                          <Badge variant="outline">
                            <Users size={12} className="mr-1" />
                            Max: {event.max_participants}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="ml-6 space-y-2">
                      <label className={`text-sm font-medium flex items-center gap-2 ${conflictEventIds.has(event.id) ? 'text-destructive' : ''}`}>
                        <Clock size={14} />
                        Select Time Slot
                        {conflictEventIds.has(event.id) && (
                          <span className="text-xs text-destructive">(Time no longer available)</span>
                        )}
                      </label>
                      <Select
                        value={selectedTimeSlot || ''}
                        onValueChange={(value) => handleTimeSlotSelection(event.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.length === 0 ? (
                            <SelectItem value="no-slots" disabled>
                              No available time slots
                            </SelectItem>
                          ) : (
                            timeSlots.map(slot => {
                              const currentSelected = selectedTimeSlot === slot.value;
                              const schoolName = !slot.available ? occupiedLabels.get(event.id)?.get(slot.value) : null;
                              
                              return (
                                <SelectItem 
                                  key={slot.value} 
                                  value={slot.value}
                                  disabled={!slot.available && !currentSelected}
                                >
                                  {slot.label}
                                  {currentSelected 
                                    ? ' (Current)' 
                                    : (!slot.available ? ` (${schoolName || 'Filled'})` : '')
                                  }
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Total Cost Summary */}
      {selectedEvents.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={16} />
              Registration Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {competition.fee && (
                <div className="flex justify-between text-sm">
                  <span>Base Registration Fee:</span>
                  <span>${competition.fee}</span>
                </div>
              )}
              {Array.from(selectedEvents).map(eventId => {
                const event = events.find(e => e.id === eventId);
                if (!event?.fee) return null;
                return (
                  <div key={eventId} className="flex justify-between text-sm">
                    <span>{event.name}:</span>
                    <span>${event.fee}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Cost:</span>
                <span>${totalCost}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleRegister} 
          disabled={selectedEvents.size === 0 || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={() => {
          setHasUnsavedChanges(false);
          navigate('/mobile/competition-portal/open');
        }}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </div>
  );
};