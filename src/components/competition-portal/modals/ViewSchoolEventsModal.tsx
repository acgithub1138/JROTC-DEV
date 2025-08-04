import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';

interface ViewSchoolEventsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  schoolId: string;
}

export const ViewSchoolEventsModal: React.FC<ViewSchoolEventsModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  schoolId,
}) => {
  const { timezone } = useSchoolTimezone();
  const { data: eventRegistrations, isLoading } = useQuery({
    queryKey: ['school-event-registrations', competitionId, schoolId],
    queryFn: async () => {
      if (!schoolId || !competitionId) return [];
      
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
            cp_events:event (
              name,
              description
            )
          )
        `)
        .eq('competition_id', competitionId)
        .eq('school_id', schoolId);

      if (error) throw error;
      return data;
    },
    enabled: open && !!schoolId && !!competitionId,
  });

  const { data: schoolInfo } = useQuery({
    queryKey: ['school-info', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('school_name')
        .eq('id', schoolId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!schoolId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Registered Events</DialogTitle>
          <DialogDescription>
            Events that {schoolInfo?.school_name || 'this school'} is registered for
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
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    {registration.cp_comp_events?.cp_events?.name || 'Unknown Event'}
                  </TableCell>
                  <TableCell>
                    {registration.cp_comp_events?.location || '-'}
                  </TableCell>
                  <TableCell>
                    {formatTimeForDisplay(
                      registration.cp_comp_events?.start_time, 
                      TIME_FORMATS.DATETIME_24H, 
                      timezone
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        registration.status === 'confirmed' ? 'default' :
                        registration.status === 'cancelled' ? 'destructive' : 'secondary'
                      }
                    >
                      {registration.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};