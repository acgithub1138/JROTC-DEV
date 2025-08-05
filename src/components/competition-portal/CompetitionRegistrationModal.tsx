import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { DollarSign, Clock, MapPin, Users, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
interface CompetitionEvent {
  id: string;
  fee: number | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  max_participants: number | null;
  event: {
    name: string;
    description: string | null;
  } | null;
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
}
export const CompetitionRegistrationModal: React.FC<CompetitionRegistrationModalProps> = ({
  isOpen,
  onClose,
  competition,
  events,
  isLoading,
  currentRegistrations
}) => {
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useAuth();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [initialSelectedEvents, setInitialSelectedEvents] = useState<Set<string>>(new Set());
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const isEditing = currentRegistrations.length > 0;

  // Convert sets to arrays for comparison
  const currentEventIds = Array.from(selectedEvents).sort();
  const initialEventIds = Array.from(initialSelectedEvents).sort();
  const {
    hasUnsavedChanges
  } = useUnsavedChanges({
    initialData: {
      events: initialEventIds
    },
    currentData: {
      events: currentEventIds
    }
  });

  // Initialize selected events with current registrations
  useEffect(() => {
    if (isOpen && currentRegistrations.length > 0) {
      const registeredEventIds = new Set(currentRegistrations.map(reg => reg.event_id));
      setSelectedEvents(registeredEventIds);
      setInitialSelectedEvents(registeredEventIds);
    } else if (isOpen) {
      setSelectedEvents(new Set());
      setInitialSelectedEvents(new Set());
    }
  }, [isOpen, currentRegistrations]);
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
    if (checked) {
      newSelectedEvents.add(eventId);
    } else {
      newSelectedEvents.delete(eventId);
    }
    setSelectedEvents(newSelectedEvents);
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
    setIsRegistering(true);
    try {
      if (isEditing) {
        // For editing, first delete existing registrations, then insert new ones
        const {
          error: deleteError
        } = await supabase.from('cp_event_registrations').delete().eq('competition_id', competition.id).eq('school_id', userProfile.school_id);
        if (deleteError) throw deleteError;
      } else {
        // Register for the competition (only for new registrations)
        const {
          error: compError
        } = await supabase.from('cp_comp_schools').insert({
          competition_id: competition.id,
          school_id: userProfile.school_id,
          status: 'registered',
          created_by: userProfile.id,
          total_fee: totalCost
        } as any);
        if (compError) throw compError;
      }

      // Update the total_fee for existing registrations (if editing)
      if (isEditing) {
        const {
          error: updateError
        } = await supabase.from('cp_comp_schools').update({
          total_fee: totalCost
        } as any).eq('competition_id', competition.id).eq('school_id', userProfile.school_id);
        if (updateError) throw updateError;
      }

      // Register for selected events using the new cp_event_registrations table
      const eventRegistrations = Array.from(selectedEvents).map(eventId => ({
        competition_id: competition.id,
        event_id: eventId,
        school_id: userProfile.school_id,
        status: 'registered',
        created_by: userProfile.id
      }));
      if (eventRegistrations.length > 0) {
        const {
          error: eventRegError
        } = await supabase.from('cp_event_registrations').insert(eventRegistrations);
        if (eventRegError) throw eventRegError;
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
  return <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {isEditing ? 'Edit Registration' : 'Register for Competition'}
            {competition && <span className="text-sm font-normal text-muted-foreground">
                - {competition.name}
              </span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Competition Info */}
          {competition && <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Competition Entry</h3>
                {competition.fee && <Badge variant="secondary">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ${competition.fee.toFixed(2)}
                  </Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(competition.start_date), 'MMM d, yyyy')}
                {competition.end_date && format(new Date(competition.end_date), 'MMM d, yyyy') !== format(new Date(competition.start_date), 'MMM d, yyyy') && ` - ${format(new Date(competition.end_date), 'MMM d, yyyy')}`}
              </p>
            </div>}

          {/* Events Selection */}
          <div>
            <h3 className="font-semibold mb-3">Select Events to Register For:</h3>
            
            {isLoading ? <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>)}
              </div> : events.length > 0 ? <div className="space-y-2">
                {events.map(event => <div key={event.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox id={event.id} checked={selectedEvents.has(event.id)} onCheckedChange={checked => handleEventSelection(event.id, checked as boolean)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                          {event.event?.name || 'Event Name Not Available'}
                        </label>
                        {event.fee && <Badge variant="outline">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${event.fee.toFixed(2)}
                          </Badge>}
                      </div>
                      
                      {event.event?.description && <p className="text-xs text-muted-foreground mb-2">
                          {event.event.description}
                        </p>}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {event.start_time && <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(event.start_time), 'MMM d, h:mm a')}</span>
                          </div>}
                        
                        {event.location && <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>}
                        
                        {event.max_participants && <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Max {event.max_participants}</span>
                          </div>}
                      </div>
                    </div>
                  </div>)}
              </div> : <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events available for this competition.</p>
              </div>}
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
                {isRegistering ? isEditing ? 'Updating...' : 'Registering...' : isEditing ? 'Update Registration' : 'Register'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleCancelDiscard} />
    </>;
};