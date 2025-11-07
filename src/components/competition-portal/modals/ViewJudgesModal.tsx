import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPhoneNumber } from '@/utils/formatUtils';
import { format } from 'date-fns';

interface Judge {
  id: string;
  judge: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  judge_profile?: {
    name: string;
    email: string | null;
    phone: string | null;
    available: boolean;
  };
}

interface ViewJudgesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
}

export const ViewJudgesModal: React.FC<ViewJudgesModalProps> = ({
  open,
  onOpenChange,
  eventId
}) => {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !eventId) {
      setJudges([]);
      return;
    }

    const fetchJudges = async () => {
      try {
        setIsLoading(true);
        
        // Get judge assignments for this event's competition
        const { data: eventData } = await supabase
          .from('cp_comp_events')
          .select('competition_id')
          .eq('id', eventId)
          .single();

        if (!eventData) return;

        // Get all judges assigned to this competition
        const { data: judgeAssignments } = await supabase
          .from('cp_comp_judges')
          .select('*')
          .eq('competition_id', eventData.competition_id);

        if (judgeAssignments && judgeAssignments.length > 0) {
          const judgeIds = judgeAssignments.map(j => j.judge);
          const { data: judgeProfiles } = await supabase
            .from('cp_judges')
            .select('id, name, email, phone, available')
            .in('id', judgeIds);

          const enrichedJudges = judgeAssignments.map(assignment => ({
            ...assignment,
            judge_profile: judgeProfiles?.find(j => j.id === assignment.judge)
          }));

          setJudges(enrichedJudges);
        }
      } catch (error) {
        console.error('Error fetching judges:', error);
        toast.error('Failed to load judges');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJudges();
  }, [open, eventId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Judges</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div>
          ) : judges.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No judges assigned to this competition
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {judges.map(judge => (
                    <TableRow key={judge.id}>
                      <TableCell className="py-[4px]">{judge.judge_profile?.name || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{judge.judge_profile?.email || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{judge.judge_profile?.phone ? formatPhoneNumber(judge.judge_profile.phone) : '-'}</TableCell>
                      <TableCell>{judge.start_time ? format(new Date(judge.start_time), 'MMM d, HH:mm') : '-'}</TableCell>
                      <TableCell>{judge.end_time ? format(new Date(judge.end_time), 'MMM d, HH:mm') : '-'}</TableCell>
                      <TableCell>{judge.location || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
