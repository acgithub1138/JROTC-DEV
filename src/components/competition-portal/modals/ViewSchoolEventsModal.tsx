import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI } from '@/utils/timezoneUtils';
import { Clock } from 'lucide-react';

interface PreferredTimeRequest {
  window?: 'morning' | 'midday' | 'afternoon' | '';
  exact_time?: string;
  notes?: string;
}

interface ViewSchoolEventsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  schoolId: string; // This is the cp_comp_schools.id
}

const getWindowLabel = (window?: string) => {
  switch (window) {
    case 'morning': return 'Morning (8AM-11AM)';
    case 'midday': return 'Midday (11AM-2PM)';
    case 'afternoon': return 'Afternoon (2PM-5PM)';
    default: return null;
  }
};

export const ViewSchoolEventsModal: React.FC<ViewSchoolEventsModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  schoolId
}) => {
  const { timezone } = useSchoolTimezone();

  // First get the school's actual school_id from the cp_comp_schools table
  const { data: schoolRegistration } = useQuery({
    queryKey: ['school-registration', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('school_id, school_name')
        .eq('id', schoolId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!schoolId
  });

  const { data: eventRegistrations, isLoading } = useQuery({
    queryKey: ['school-event-registrations', competitionId, schoolRegistration?.school_id],
    queryFn: async () => {
      if (!schoolRegistration?.school_id || !competitionId) return [];
      
      // Get event registrations
      const { data, error } = await supabase
        .from('cp_event_registrations')
        .select(`
          *,
          cp_comp_events:event_id (
            id,
            location,
            start_time,
            end_time,
            max_participants,
            competition_event_types!event (
              name
            )
          )
        `)
        .eq('competition_id', competitionId)
        .eq('school_id', schoolRegistration.school_id);
      if (error) throw error;
      
      // Get schedule data for this school in this competition
      const { data: schedules, error: schedulesError } = await supabase
        .from('cp_event_schedules')
        .select('event_id, scheduled_time')
        .eq('competition_id', competitionId)
        .eq('school_id', schoolRegistration.school_id);
      if (schedulesError) throw schedulesError;
      
      // Create schedule map by event_id
      const scheduleMap = new Map(
        schedules?.map(s => [s.event_id, s.scheduled_time]) || []
      );
      
      // Enrich registrations with scheduled time
      return data?.map(reg => ({
        ...reg,
        scheduled_time: scheduleMap.get(reg.event_id) || null
      })) || [];
    },
    enabled: open && !!schoolRegistration?.school_id && !!competitionId
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Registered Events</DialogTitle>
          <DialogDescription>
            Events that {schoolRegistration?.school_name || 'this school'} is registered for
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-4 text-center">Loading events...</div>
        ) : !eventRegistrations || eventRegistrations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            This school is not registered for any events
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time Preference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventRegistrations.map(registration => {
                const timeRequest = registration.preferred_time_request as PreferredTimeRequest | null;
                const windowLabel = getWindowLabel(timeRequest?.window);
                
                return (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium py-[6px]">
                      {registration.cp_comp_events?.competition_event_types?.name || 'Unknown Event'}
                    </TableCell>
                    <TableCell>
                      {registration.cp_comp_events?.location || '-'}
                    </TableCell>
                    <TableCell>
                      {registration.scheduled_time ? (
                        <span className="text-sm">
                          {convertToUI(registration.scheduled_time, timezone, 'datetime')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          registration.status === 'confirmed'
                            ? 'default'
                            : registration.status === 'cancelled'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {registration.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {timeRequest && windowLabel ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Clock className="h-3 w-3" />
                                <span className="text-sm">{windowLabel}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p><strong>Window:</strong> {windowLabel}</p>
                                {timeRequest.exact_time && (
                                  <p><strong>Exact Time:</strong> {timeRequest.exact_time}</p>
                                )}
                                {timeRequest.notes && (
                                  <p><strong>Notes:</strong> {timeRequest.notes}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
