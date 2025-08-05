import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { DollarSign, Clock, MapPin, Users, Trophy } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface TimeSlot {
  time: Date;
  label: string;
  available: boolean;
}

interface CompetitionEvent {
  id: string;
  fee: number | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  lunch_start_time?: string | null;
  lunch_end_time?: string | null;
  max_participants: number | null;
  interval: number | null;
  event: {
    name: string;
    description: string | null;
  } | null;
  timeSlots?: TimeSlot[];
}

interface Competition {
  id: string;
  name: string;
  fee: number | null;
  start_date: string;
  end_date: string;
}

interface CompetitionRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: Competition | null;
  events: CompetitionEvent[];
  isLoading: boolean;
  currentRegistrations: {
    event_id: string;
  }[];
  currentSchedules?: {
    event_id: string;
    scheduled_time: string;
  }[];
}

export const CompetitionRegistrationModal: React.FC<CompetitionRegistrationModalProps> = ({
  isOpen,
  onClose,
  competition,
  events,
  isLoading,
  currentRegistrations,
  currentSchedules
}) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [initialSelectedEvents, setInitialSelectedEvents] = useState<Set<string>>(new Set());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Map<string, string>>(new Map());
  const [initialSelectedTimeSlots, setInitialSelectedTimeSlots] = useState<Map<string, string>>(new Map());
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<Map<string, Set<string>>>(new Map());
  
  const isEditing = currentRegistrations.length > 0;

  // Convert sets and maps to arrays for comparison
  const currentEventIds = Array.from(selectedEvents).sort();
  const initialEventIds = Array.from(initialSelectedEvents).sort();
  const currentTimeSlotEntries = Array.from(selectedTimeSlots.entries()).sort();
  const initialTimeSlotEntries = Array.from(initialSelectedTimeSlots.entries()).sort();
  
  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: {
      events: initialEventIds,
      timeSlots: initialTimeSlotEntries
    },
    currentData: {
      events: currentEventIds,
      timeSlots: currentTimeSlotEntries
    }
  });

  // Generate time slots for an event
  const generateTimeSlots = (event: CompetitionEvent): TimeSlot[] => {
    if (!event.start_time || !event.end_time) return [];
    
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const interval = event.interval || 15; // Default 15 minutes
    const slots: TimeSlot[] = [];
    
    let current = new Date(start);
    const eventOccupiedSlots = occupiedSlots.get(event.id) || new Set();
    
    while (current < end) {
      const slotTime = new Date(current);
      const timeString = slotTime.toISOString();
      
      // Check if this slot is during lunch break
      const fullEvent = events.find(e => e.id === event.id);
      let isLunchBreak = false;
      
      if (fullEvent && fullEvent.lunch_start_time && fullEvent.lunch_end_time) {
        const currentTime = format(current, 'HH:mm');
        const lunchStartTime = format(new Date(fullEvent.lunch_start_time), 'HH:mm');
        const lunchEndTime = format(new Date(fullEvent.lunch_end_time), 'HH:mm');
        
        isLunchBreak = currentTime >= lunchStartTime && currentTime < lunchEndTime;
      }
      
      // Skip lunch break slots and occupied slots - don't add them to available time slots
      if (!isLunchBreak && !eventOccupiedSlots.has(timeString)) {
        slots.push({
          time: slotTime,
          label: format(slotTime, 'h:mm a'),
          available: true
        });
      }
      
      current = addMinutes(current, interval);
    }
    
    return slots;
  };

  // Fetch occupied slots when modal opens
  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      if (!isOpen || !competition?.id) return;
      
      try {
        const { data: schedules, error } = await supabase
          .from('cp_event_schedules')
          .select('event_id, scheduled_time, school_id')
          .eq('competition_id', competition.id);

        if (error) throw error;

        const occupied = new Map<string, Set<string>>();
        schedules?.forEach(schedule => {
          // When editing, allow current school to re-select their own slots
          // Always mark slots occupied by other schools as unavailable
          if (isEditing && schedule.school_id === userProfile?.school_id) return;
          
          if (!occupied.has(schedule.event_id)) {
            occupied.set(schedule.event_id, new Set());
          }
          occupied.get(schedule.event_id)?.add(schedule.scheduled_time);
        });
        
        setOccupiedSlots(occupied);
      } catch (error) {
        console.error('Error fetching occupied slots:', error);
      }
    };

    fetchOccupiedSlots();
  }, [isOpen, competition?.id, isEditing, userProfile?.school_id]);

  // Initialize selected events and time slots with current registrations
  useEffect(() => {
    if (isOpen && currentRegistrations.length > 0) {
      const registeredEventIds = new Set(currentRegistrations.map(reg => reg.event_id));
      setSelectedEvents(registeredEventIds);
      setInitialSelectedEvents(registeredEventIds);
      
      // Initialize time slots from current schedules
      const timeSlotMap = new Map<string, string>();
      currentSchedules?.forEach(schedule => {
        timeSlotMap.set(schedule.event_id, schedule.scheduled_time);
      });
      setSelectedTimeSlots(timeSlotMap);
      setInitialSelectedTimeSlots(new Map(timeSlotMap));
    } else if (isOpen) {
      setSelectedEvents(new Set());
      setInitialSelectedEvents(new Set());
      setSelectedTimeSlots(new Map());
      setInitialSelectedTimeSlots(new Map());
    }
  }, [isOpen, currentRegistrations, currentSchedules]);

  const totalCost = useMemo(() => {
    const competitionFee = competition?.fee || 0;
    const eventsFee = Array.from(selectedEvents).reduce((sum, eventId) => {
      const event = events.find(e => e.id === eventId);
      return sum + (event?.fee || 0);
    }, 0);
    return competitionFee + eventsFee;
  }, [competition?.fee, selectedEvents, events]);

  const handleEventSelection = (eventId: string, checked: boolean) => {
    const newSelectedEvents = new Set(selectedEvents);
    const newSelectedTimeSlots = new Map(selectedTimeSlots);
    
    if (checked) {
      newSelectedEvents.add(eventId);
    } else {
      newSelectedEvents.delete(eventId);
      newSelectedTimeSlots.delete(eventId); // Remove time slot when deselecting event
    }
    
    setSelectedEvents(newSelectedEvents);
    setSelectedTimeSlots(newSelectedTimeSlots);
  };

  const handleTimeSlotSelection = (eventId: string, timeSlot: string) => {
    const newSelectedTimeSlots = new Map(selectedTimeSlots);
    newSelectedTimeSlots.set(eventId, timeSlot);
    setSelectedTimeSlots(newSelectedTimeSlots);
  };

  const handleRegister = async () => {
    if (!competition || !userProfile?.school_id) {
      toast({
        title: "Registration Error",
        description: "Please ensure you are logged in and try again.",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedEvents.size === 0) {
      toast({
        title: "No Events Selected",
        description: "Please select at least one event to register for.",
        variant: "destructive"
      });
      return;
    }

    // Check that all selected events have time slots selected
    const eventsWithoutTimeSlots = Array.from(selectedEvents).filter(eventId => {
      const event = events.find(e => e.id === eventId);
      return event?.start_time && event?.end_time && !selectedTimeSlots.has(eventId);
    });

    if (eventsWithoutTimeSlots.length > 0) {
      toast({
        title: "Time Slots Required",
        description: "Please select time slots for all selected events.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      if (isEditing) {
        // For editing, first delete existing registrations and schedules, then insert new ones
        const { error: deleteRegError } = await supabase
          .from('cp_event_registrations')
          .delete()
          .eq('competition_id', competition.id)
          .eq('school_id', userProfile.school_id);
        if (deleteRegError) throw deleteRegError;

        const { error: deleteScheduleError } = await supabase
          .from('cp_event_schedules')
          .delete()
          .eq('competition_id', competition.id)
          .eq('school_id', userProfile.school_id);
        if (deleteScheduleError) throw deleteScheduleError;
      } else {
        // Register for the competition (only for new registrations)
        const { error: compError } = await supabase
          .from('cp_comp_schools')
          .insert({
            competition_id: competition.id,
            school_id: userProfile.school_id,
            status: 'registered',
            created_by: userProfile.id,
            total_fee: totalCost
          });
        if (compError) throw compError;
      }

      // Update the total_fee for existing registrations (if editing)
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('cp_comp_schools')
          .update({
            total_fee: totalCost
          })
          .eq('competition_id', competition.id)
          .eq('school_id', userProfile.school_id);
        if (updateError) throw updateError;
      }

      // Register for selected events using the cp_event_registrations table
      const eventRegistrations = Array.from(selectedEvents).map(eventId => ({
        competition_id: competition.id,
        event_id: eventId,
        school_id: userProfile.school_id,
        status: 'registered',
        created_by: userProfile.id
      }));
      
      if (eventRegistrations.length > 0) {
        const { error: eventRegError } = await supabase
          .from('cp_event_registrations')
          .insert(eventRegistrations);
        if (eventRegError) throw eventRegError;
      }

      // Insert schedule records for selected time slots
      const scheduleInserts = Array.from(selectedEvents)
        .filter(eventId => selectedTimeSlots.has(eventId))
        .map(eventId => ({
          competition_id: competition.id,
          event_id: eventId,
          school_id: userProfile.school_id,
          scheduled_time: selectedTimeSlots.get(eventId),
          created_by: userProfile.id
        }));

      if (scheduleInserts.length > 0) {
        const { error: scheduleError } = await supabase
          .from('cp_event_schedules')
          .insert(scheduleInserts);
        if (scheduleError) throw scheduleError;
      }

      toast({
        title: isEditing ? "Registration Updated!" : "Registration Successful!",
        description: `Successfully ${isEditing ? 'updated' : 'registered for'} ${competition.name} and ${selectedEvents.size} event(s). Total cost: $${totalCost.toFixed(2)}`
      });
      
      onClose();
      setSelectedEvents(new Set());
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: isEditing ? "Update Failed" : "Registration Failed",
        description: error.message || `There was an error ${isEditing ? 'updating' : 'registering for'} the competition. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setSelectedEvents(initialSelectedEvents);
    setSelectedTimeSlots(initialSelectedTimeSlots);
    setShowUnsavedDialog(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setShowUnsavedDialog(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      setSelectedEvents(new Set());
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {isEditing ? 'Edit Registration' : 'Register for Competition'}
              {competition && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {competition.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Competition Info */}
            {competition && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Competition Entry</h3>
                  {competition.fee && (
                    <Badge variant="secondary">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ${competition.fee.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(competition.start_date), 'MMM d, yyyy')}
                  {competition.end_date && format(new Date(competition.end_date), 'MMM d, yyyy') !== format(new Date(competition.start_date), 'MMM d, yyyy') && 
                    ` - ${format(new Date(competition.end_date), 'MMM d, yyyy')}`
                  }
                </p>
              </div>
            )}

            {/* Events Selection */}
            <div>
              <h3 className="font-semibold mb-3">Select Events to Register For:</h3>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-2">
                  {events.map(event => (
                    <div key={event.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        id={event.id}
                        checked={selectedEvents.has(event.id)}
                        onCheckedChange={(checked) => handleEventSelection(event.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                            {event.event?.name || 'Event Name Not Available'}
                          </label>
                          {event.fee && (
                            <Badge variant="outline">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${event.fee.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        
                        {event.event?.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {event.event.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {event.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(event.start_time), 'MMM d, h:mm a')}</span>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.max_participants && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>Max {event.max_participants}</span>
                            </div>
                          )}
                        </div>

                        {/* Time Slot Selection */}
                        {selectedEvents.has(event.id) && event.start_time && event.end_time && (
                          <div className="mt-3">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Select Time Slot:
                            </label>
                            <Select
                              value={selectedTimeSlots.get(event.id) || ''}
                              onValueChange={(value) => handleTimeSlotSelection(event.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Choose a time slot" />
                              </SelectTrigger>
                              <SelectContent>
                                 {generateTimeSlots(event).map((slot) => (
                                   <SelectItem
                                     key={slot.time.toISOString()}
                                     value={slot.time.toISOString()}
                                   >
                                     {slot.label}
                                   </SelectItem>
                                 ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No events available for this competition.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total Cost:</span>
                <Badge variant="secondary" className="text-base">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ${totalCost.toFixed(2)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isRegistering}>
                  Cancel
                </Button>
                <Button onClick={handleRegister} disabled={isRegistering || selectedEvents.size === 0}>
                  {isRegistering 
                    ? (isEditing ? 'Updating...' : 'Registering...') 
                    : (isEditing ? 'Update Registration' : 'Register')
                  }
                </Button>
              </div>
            </div>
          </DialogFooter>
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
