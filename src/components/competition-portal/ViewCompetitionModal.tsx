import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, School, Clock, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { EditCompetitionModal } from './modals/EditCompetitionModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants?: number;
  registration_deadline?: string;
  registered_schools: string[];
  status: string;
  is_public: boolean;
  school_id: string;
  created_at: string;
  created_by?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  program?: string;
}
interface ViewCompetitionModalProps {
  competition: Competition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostSchoolName: string;
  onCompetitionUpdated?: () => void;
}
export const ViewCompetitionModal: React.FC<ViewCompetitionModalProps> = ({
  competition,
  open,
  onOpenChange,
  hostSchoolName,
  onCompetitionUpdated
}) => {
  const {
    userProfile
  } = useAuth();
  const {
    canEdit
  } = useTablePermissions('cp_competitions');
  const [showEditModal, setShowEditModal] = useState(false);
  if (!competition) return null;
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'open':
        return 'default';
      case 'registration_closed':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  const canEditCompetition = canEdit && (competition?.school_id === userProfile?.school_id || userProfile?.role === 'admin');
  const handleEditClick = () => {
    setShowEditModal(true);
  };
  const handleEditSubmit = async (data: any) => {
    try {
      const {
        error
      } = await supabase.from('cp_competitions').update(data).eq('id', competition?.id);
      if (error) throw error;
      toast.success('Competition updated successfully');
      if (onCompetitionUpdated) {
        onCompetitionUpdated();
      }
      // Close both the edit modal and the view modal
      setShowEditModal(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating competition:', error);
      toast.error('Failed to update competition');
    }
  };
  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{competition.name}
          <Badge variant={getStatusBadgeVariant(competition.program)} className="text-sm">
              {competition.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Competition details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center gap-4">
            Status: <Badge variant={getStatusBadgeVariant(competition.status)} className="text-sm">
              {competition.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Description */}
          {competition.description && <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{competition.description}</p>
            </div>}

          {/* Host School */}
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Host School:</span>
            <span>{hostSchoolName}</span>
          </div>

          {/* Date Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Competition Date:</span>
              <span>{format(new Date(competition.start_date), 'MMMM d, yyyy')}</span>
            </div>
            {competition.start_date !== competition.end_date && <div className="flex items-center gap-2 ml-7">
                <span className="font-medium">End Date:</span>
                <span>{format(new Date(competition.end_date), 'MMMM d, yyyy')}</span>
              </div>}
            {competition.registration_deadline && <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Registration Deadline:</span>
                <span>{format(new Date(competition.registration_deadline), 'MMMM d, yyyy')}</span>
              </div>}
          </div>

          {/* Location */}
          {(competition.address || competition.city || competition.state) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Location:</span>
              </div>
              <div className="ml-7 text-sm space-y-1">
                {competition.address && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([competition.address, competition.city, competition.state, competition.zip].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {competition.address}
                  </a>
                )}
                {(competition.city || competition.state || competition.zip) && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([competition.address, competition.city, competition.state, competition.zip].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-primary hover:underline cursor-pointer"
                  >
                    {[competition.city, competition.state].filter(Boolean).join(', ')}{competition.zip ? ` ${competition.zip}` : ''}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Registered Schools:</span>
            <span>{competition.registered_schools.length}</span>
            {competition.max_participants && <span className="text-muted-foreground">/ {competition.max_participants} max</span>}
          </div>

          {/* Additional Info */}
          <div className="text-sm text-muted-foreground">
            <p>Created on {format(new Date(competition.created_at), 'MMMM d, yyyy')}</p>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEditCompetition && <Button onClick={handleEditClick}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Modal - Separate from main dialog */}
    {showEditModal && <EditCompetitionModal open={showEditModal} onOpenChange={setShowEditModal} competition={competition} onSubmit={handleEditSubmit} />}
    </>;
};