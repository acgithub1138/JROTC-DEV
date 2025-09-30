import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPhoneNumber } from '@/utils/formatUtils';
type CompEvent = Database['public']['Tables']['cp_comp_events']['Row'];
type Judge = Database['public']['Tables']['cp_judges']['Row'];
interface ViewJudgesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CompEvent | null;
}
export const ViewJudgesModal: React.FC<ViewJudgesModalProps> = ({
  open,
  onOpenChange,
  event
}) => {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!open || !event?.judges || event.judges.length === 0) {
      setJudges([]);
      return;
    }
    const fetchJudges = async () => {
      try {
        setIsLoading(true);
        const {
          data,
          error
        } = await supabase.from('cp_judges').select('*').in('id', event.judges);
        if (error) throw error;
        setJudges(data || []);
      } catch (error) {
        console.error('Error fetching judges:', error);
        toast.error('Failed to load judges');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJudges();
  }, [open, event]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Judges</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div> : judges.length === 0 ? <p className="text-muted-foreground text-center py-4">
              No judges assigned to this event
            </p> : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {judges.map(judge => <TableRow key={judge.id}>
                      <TableCell className="py-[4px]">{judge.name || '-'}</TableCell>
                      <TableCell>{judge.email || '-'}</TableCell>
                      <TableCell>{formatPhoneNumber(judge.phone)}</TableCell>
                      <TableCell>{judge.available ? 'Yes' : 'No'}</TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};