import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface EditSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  schoolId: string; // This is the cp_comp_schools.id
  onSchoolUpdated?: () => void;
}

interface EventOption {
  id: string;
  name: string;
  location?: string;
  fee?: number;
}

export const EditSchoolModal: React.FC<EditSchoolModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  schoolId,
  onSchoolUpdated
}) => {
  const queryClient = useQueryClient();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string>('registered');
  const [paid, setPaid] = useState<boolean>(false);
  const [totalFee, setTotalFee] = useState<number>(0);

  // Get school registration details
  const { data: schoolRegistration } = useQuery({
    queryKey: ['school-registration', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('id, school_id, school_name, status, paid')
        .eq('id', schoolId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!schoolId
  });

  // Get competition details including base fee
  const { data: competition } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: async () => {
      if (!competitionId) return null;
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('id, name, fee')
        .eq('id', competitionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!competitionId
  });

  // Get available events for this competition
  const { data: availableEvents } = useQuery({
    queryKey: ['competition-events', competitionId],
    queryFn: async () => {
      if (!competitionId) return [];
      const { data, error } = await supabase
        .from('cp_comp_events')
        .select(`
          id,
          location,
          fee,
          cp_events:event (
            id,
            name
          )
        `)
        .eq('competition_id', competitionId);
      if (error) throw error;
      
      return data.map(event => ({
        id: event.id,
        name: event.cp_events?.name || 'Unknown Event',
        location: event.location,
        fee: event.fee || 0
      }));
    },
    enabled: open && !!competitionId
  });

  // Get currently registered events
  const { data: currentEventRegistrations } = useQuery({
    queryKey: ['school-event-registrations', competitionId, schoolRegistration?.school_id],
    queryFn: async () => {
      if (!schoolRegistration?.school_id || !competitionId) return [];
      const { data, error } = await supabase
        .from('cp_event_registrations')
        .select('event_id')
        .eq('competition_id', competitionId)
        .eq('school_id', schoolRegistration.school_id);
      if (error) throw error;
      return data.map(reg => reg.event_id);
    },
    enabled: open && !!schoolRegistration?.school_id && !!competitionId
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (schoolRegistration) {
      setStatus(schoolRegistration.status || 'registered');
      setPaid(schoolRegistration.paid || false);
    }
    if (currentEventRegistrations) {
      setSelectedEvents(new Set(currentEventRegistrations));
    }
  }, [schoolRegistration, currentEventRegistrations]);

  // Function to calculate total fee
  const calculateTotalFee = (eventIds: string[], events: EventOption[], baseFee: number = 0) => {
    const eventFees = eventIds.reduce((total, eventId) => {
      const event = events?.find(e => e.id === eventId);
      return total + (event?.fee || 0);
    }, 0);
    return baseFee + eventFees;
  };

  // Update total fee whenever selected events change
  useEffect(() => {
    if (availableEvents && competition) {
      const newTotalFee = calculateTotalFee(
        Array.from(selectedEvents), 
        availableEvents, 
        competition.fee || 0
      );
      setTotalFee(newTotalFee);
    }
  }, [selectedEvents, availableEvents, competition]);

  const updateSchoolMutation = useMutation({
    mutationFn: async ({ eventIds, schoolStatus, schoolPaid, calculatedTotalFee }: { 
      eventIds: string[]; 
      schoolStatus: string; 
      schoolPaid: boolean;
      calculatedTotalFee: number;
    }) => {
      if (!schoolRegistration) throw new Error('School registration not found');

      // Update school status, paid status, and total fee
      const { error: schoolUpdateError } = await supabase
        .from('cp_comp_schools')
        .update({ 
          status: schoolStatus, 
          paid: schoolPaid,
          total_fee: calculatedTotalFee,
          updated_at: new Date().toISOString()
        })
        .eq('id', schoolId);
      
      if (schoolUpdateError) throw schoolUpdateError;

      // Delete existing event registrations
      const { error: deleteError } = await supabase
        .from('cp_event_registrations')
        .delete()
        .eq('competition_id', competitionId)
        .eq('school_id', schoolRegistration.school_id);
      
      if (deleteError) throw deleteError;

      // Insert new event registrations
      if (eventIds.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const eventRegistrations = eventIds.map(eventId => ({
          competition_id: competitionId,
          school_id: schoolRegistration.school_id,
          event_id: eventId,
          status: 'registered',
          created_by: user?.id
        }));

        const { error: insertError } = await supabase
          .from('cp_event_registrations')
          .insert(eventRegistrations);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast.success('School registration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['competition-schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-event-registrations'] });
      onSchoolUpdated?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating school registration:', error);
      toast.error('Failed to update school registration');
    }
  });

  const handleSave = () => {
    const calculatedTotalFee = calculateTotalFee(
      Array.from(selectedEvents), 
      availableEvents || [], 
      competition?.fee || 0
    );
    
    updateSchoolMutation.mutate({
      eventIds: Array.from(selectedEvents),
      schoolStatus: status,
      schoolPaid: paid,
      calculatedTotalFee
    });
  };

  const handleEventToggle = (eventId: string, checked: boolean) => {
    const newSelectedEvents = new Set(selectedEvents);
    if (checked) {
      newSelectedEvents.add(eventId);
    } else {
      newSelectedEvents.delete(eventId);
    }
    setSelectedEvents(newSelectedEvents);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit School Registration</DialogTitle>
          <DialogDescription>
            Update registration details for {schoolRegistration?.school_name || 'this school'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* School Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Registration Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="paid"
              checked={paid}
              onCheckedChange={setPaid}
            />
            <Label htmlFor="paid">Payment Received</Label>
          </div>

          {/* Event Selection */}
          <div className="space-y-3">
            <Label>Registered Events</Label>
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3">
              {availableEvents?.map((event) => (
                <div key={event.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={event.id}
                    checked={selectedEvents.has(event.id)}
                    onCheckedChange={(checked) => handleEventToggle(event.id, checked as boolean)}
                  />
                   <Label htmlFor={event.id} className="flex-1 cursor-pointer">
                     <div className="flex justify-between items-center">
                       <span>
                         {event.name}
                         {event.location && (
                           <span className="text-sm text-muted-foreground ml-2">
                             @ {event.location}
                           </span>
                         )}
                       </span>
                       {event.fee && event.fee > 0 && (
                         <span className="text-sm font-medium text-primary">
                           ${event.fee}
                         </span>
                       )}
                     </div>
                   </Label>
                </div>
              ))}
              {!availableEvents || availableEvents.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No events available for this competition
                </div>
              )}
            </div>
          </div>

          {/* Total Fee Display */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Competition Fee Breakdown:</Label>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Base Competition Fee:</span>
                <span>${competition?.fee || 0}</span>
              </div>
              {selectedEvents.size > 0 && (
                <div className="flex justify-between">
                  <span>Event Fees ({selectedEvents.size} events):</span>
                  <span>
                    ${availableEvents
                      ?.filter(event => selectedEvents.has(event.id))
                      .reduce((total, event) => total + (event.fee || 0), 0) || 0}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total Fee:</span>
                <span className="text-primary">${totalFee}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateSchoolMutation.isPending}
            >
              {updateSchoolMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};