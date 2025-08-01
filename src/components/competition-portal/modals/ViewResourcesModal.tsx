import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', event.resources);

        if (error) throw error;
        setResources(data || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast.error('Failed to load resources');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [open, event]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Event Resources</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No resources assigned to this event
            </p>
          ) : (
            <div className="space-y-2">
              {resources.map(resource => (
                <div key={resource.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium">
                    {resource.last_name}, {resource.first_name}
                  </h4>
                  {resource.email && (
                    <p className="text-sm text-muted-foreground">{resource.email}</p>
                  )}
                  {resource.phone && (
                    <p className="text-sm text-muted-foreground">{resource.phone}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};