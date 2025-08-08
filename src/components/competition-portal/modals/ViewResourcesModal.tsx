import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
type CompEvent = Database['public']['Tables']['cp_comp_events']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
interface ViewResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CompEvent | null;
}
export const ViewResourcesModal: React.FC<ViewResourcesModalProps> = ({
  open,
  onOpenChange,
  event
}) => {
  const [resources, setResources] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!open || !event?.resources || event.resources.length === 0) {
      setResources([]);
      return;
    }
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        const {
          data,
          error
        } = await supabase.from('profiles').select('*').in('id', event.resources);
        if (error) throw error;
        setResources((data || []).sort((a, b) => {
          const aLast = (a.last_name || '').toLowerCase();
          const bLast = (b.last_name || '').toLowerCase();
          if (aLast !== bLast) return aLast.localeCompare(bLast);
          const aFirst = (a.first_name || '').toLowerCase();
          const bFirst = (b.first_name || '').toLowerCase();
          return aFirst.localeCompare(bFirst);
        }));
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast.error('Failed to load resources');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, [open, event]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Resources</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div> : resources.length === 0 ? <p className="text-muted-foreground text-center py-4">
              No resources assigned to this event
            </p> : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map(resource => (
                    <TableRow key={resource.id}>
                      <TableCell className="py-[4px]">{resource.last_name}, {resource.first_name}</TableCell>
                      <TableCell>{resource.email || '-'}</TableCell>
                      <TableCell>{resource.phone || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};