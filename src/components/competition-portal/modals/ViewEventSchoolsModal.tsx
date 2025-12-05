import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { School, Users, Clock } from 'lucide-react';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI } from '@/utils/timezoneUtils';

interface PreferredTimeRequest {
  window?: 'morning' | 'midday' | 'afternoon';
  exact_time?: string;
  notes?: string;
}

interface ViewEventSchoolsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    cp_events?: {
      name: string;
    } | null;
  } | null;
}

export const ViewEventSchoolsModal: React.FC<ViewEventSchoolsModalProps> = ({
  open,
  onOpenChange,
  event
}) => {
  const { timezone } = useSchoolTimezone();

  const {
    data: registeredSchools,
    isLoading
  } = useQuery({
    queryKey: ['event-schools', event?.id],
    queryFn: async () => {
      if (!event?.id) return [];

      // First get the event registrations
      const {
        data: registrations,
        error
      } = await supabase.from('cp_event_registrations').select('id, status, notes, created_at, school_id, competition_id, preferred_time_request').eq('event_id', event.id).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      if (!registrations || registrations.length === 0) {
        return [];
      }

      // Get school details for each registration
      const schoolIds = registrations.map(reg => reg.school_id);
      const {
        data: schools,
        error: schoolsError
      } = await supabase.from('cp_comp_schools').select('id, school_name, school_id, status').in('school_id', schoolIds);
      if (schoolsError) throw schoolsError;

      // Get schedule data for this event
      const {
        data: schedules,
        error: schedulesError
      } = await supabase.from('cp_event_schedules').select('school_id, scheduled_time').eq('event_id', event.id);
      if (schedulesError) throw schedulesError;

      // Create schedule map by school_id
      const scheduleMap = new Map(
        schedules?.map(s => [s.school_id, s.scheduled_time]) || []
      );

      // Combine the data
      const enrichedRegistrations = registrations.map(registration => {
        const school = schools?.find(s => s.school_id === registration.school_id);
        return {
          ...registration,
          school_details: school,
          preferred_time_request: registration.preferred_time_request as PreferredTimeRequest | null,
          scheduled_time: scheduleMap.get(registration.school_id) || null
        };
      });
      return enrichedRegistrations;
    },
    enabled: open && !!event?.id
  });

  const getWindowLabel = (window?: string) => {
    const labels: Record<string, string> = {
      morning: 'Morning',
      midday: 'Midday',
      afternoon: 'Afternoon'
    };
    return labels[window || ''] || window || '';
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <School className="w-5 h-5" />
            <DialogTitle>Registered Schools</DialogTitle>
          </div>
          <DialogDescription>
            Schools registered for: {event?.cp_events?.name || 'Unknown Event'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? <div className="p-4 text-center">Loading registered schools...</div> : !registeredSchools || registeredSchools.length === 0 ? <div className="p-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No Schools Registered</p>
            <p className="text-sm">No schools have registered for this event yet.</p>
          </div> : <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {registeredSchools.length} school{registeredSchools.length !== 1 ? 's' : ''} registered
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Time Preference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registeredSchools.map(registration => <TableRow key={registration.id}>
                    <TableCell className="font-medium py-[4px]">
                      {registration.school_details?.school_name || 'Unknown School'}
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
                      {registration.preferred_time_request?.window ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-help">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <Badge variant="outline" className="text-xs">
                                  {getWindowLabel(registration.preferred_time_request.window)}
                                </Badge>
                                {registration.preferred_time_request.exact_time && (
                                  <span className="text-xs text-muted-foreground">
                                    ({registration.preferred_time_request.exact_time})
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Preferred: {getWindowLabel(registration.preferred_time_request.window)}</p>
                                {registration.preferred_time_request.exact_time && (
                                  <p className="text-sm">Requested time: {registration.preferred_time_request.exact_time}</p>
                                )}
                                {registration.preferred_time_request.notes && (
                                  <p className="text-sm text-muted-foreground">{registration.preferred_time_request.notes}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={registration.notes || ''}>
                        {registration.notes || '-'}
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </DialogContent>
    </Dialog>;
};
