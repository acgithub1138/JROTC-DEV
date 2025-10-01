import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPhoneNumber } from '@/utils/formatUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface Resource {
  id: string;
  resource: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  cadet_profile?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
}

interface ViewResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
}

export const ViewResourcesModal: React.FC<ViewResourcesModalProps> = ({
  open,
  onOpenChange,
  eventId
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !eventId) {
      setResources([]);
      return;
    }

    const fetchResources = async () => {
      try {
        setIsLoading(true);
        
        // Get resource assignments for this event's competition
        const { data: eventData } = await supabase
          .from('cp_comp_events')
          .select('competition_id')
          .eq('id', eventId)
          .single();

        if (!eventData) return;

        // Get all resources assigned to this competition
        const { data: resourceAssignments } = await supabase
          .from('cp_comp_resources')
          .select('*')
          .eq('competition_id', eventData.competition_id);

        if (resourceAssignments && resourceAssignments.length > 0) {
          const resourceIds = resourceAssignments.map(r => r.resource);
          const { data: cadetProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .in('id', resourceIds);

          const enrichedResources = resourceAssignments.map(assignment => ({
            ...assignment,
            cadet_profile: cadetProfiles?.find(c => c.id === assignment.resource)
          }));

          setResources(enrichedResources);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast.error('Failed to load resources');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [open, eventId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Resources</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div>
          ) : resources.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No resources assigned to this competition
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map(resource => (
                    <TableRow key={resource.id}>
                      <TableCell className="py-[4px]">
                        {resource.cadet_profile ? `${resource.cadet_profile.last_name}, ${resource.cadet_profile.first_name}` : '-'}
                      </TableCell>
                      <TableCell>{resource.cadet_profile?.email || '-'}</TableCell>
                      <TableCell>{resource.cadet_profile?.phone ? formatPhoneNumber(resource.cadet_profile.phone) : '-'}</TableCell>
                      <TableCell>{resource.start_time ? format(new Date(resource.start_time), 'MMM d, HH:mm') : '-'}</TableCell>
                      <TableCell>{resource.end_time ? format(new Date(resource.end_time), 'MMM d, HH:mm') : '-'}</TableCell>
                      <TableCell>{resource.location || '-'}</TableCell>
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
