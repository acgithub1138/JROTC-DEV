import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddSchoolEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  schoolRegistrationId: string; // cp_comp_schools.id
}

export const AddSchoolEventModal: React.FC<AddSchoolEventModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  schoolRegistrationId
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Loaded context
  const [schoolInfo, setSchoolInfo] = useState<{ school_id: string; school_name: string } | null>(null);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);

  // Load school info (resolve cp_comp_schools -> school_id)
  useEffect(() => {
    const loadSchool = async () => {
      if (!open || !schoolRegistrationId) return;
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('school_id, school_name')
        .eq('id', schoolRegistrationId)
        .maybeSingle();
      if (error) {
        console.error(error);
        toast.error('Failed to load school');
        return;
      }
      if (data) setSchoolInfo(data as any);
    };
    loadSchool();
  }, [open, schoolRegistrationId]);

  // Load available events (not yet registered)
  useEffect(() => {
    const loadAvailableEvents = async () => {
      if (!open || !schoolInfo?.school_id || !competitionId) return;
      
      // Get all events for this competition
      const { data: allEvents, error: eventsError } = await supabase
        .from('cp_comp_events')
        .select(`
          id,
          location,
          start_time,
          end_time,
          competition_event_types:event (
            id,
            name
          )
        `)
        .eq('competition_id', competitionId);
      
      if (eventsError) {
        console.error(eventsError);
        toast.error('Failed to load events');
        return;
      }

      // Get already registered events for this school
      const { data: registeredEvents, error: regError } = await supabase
        .from('cp_event_registrations')
        .select('event_id')
        .eq('competition_id', competitionId)
        .eq('school_id', schoolInfo.school_id)
        .neq('status', 'cancelled');
      
      if (regError) {
        console.error(regError);
        toast.error('Failed to load registered events');
        return;
      }

      const registeredEventIds = new Set(registeredEvents?.map(r => r.event_id) || []);
      const available = allEvents?.filter(event => !registeredEventIds.has(event.id)) || [];
      
      setAvailableEvents(available);
    };
    loadAvailableEvents();
  }, [open, schoolInfo?.school_id, competitionId]);

  const handleSubmit = async () => {
    if (!selectedEventId || !schoolInfo?.school_id) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('cp_event_registrations')
        .insert({
          competition_id: competitionId,
          school_id: schoolInfo.school_id,
          event_id: selectedEventId,
          status: 'registered'
        });
        
      if (error) throw error;

      toast.success('School registered for event');
      setSelectedEventId('');
      onOpenChange(false);
    } catch (e) {
      console.error('Error registering for event:', e);
      toast.error('Failed to register for event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = !!selectedEventId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Register School for Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Available Events</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder={availableEvents.length ? 'Select an event...' : 'No available events'} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {availableEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.competition_event_types?.name || 'Unnamed Event'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};