import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, MapPin, Users, Edit } from 'lucide-react';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';

interface ViewCompetitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: any;
  onEdit?: () => void;
}

export const ViewCompetitionDialog: React.FC<ViewCompetitionDialogProps> = ({
  open,
  onOpenChange,
  competition,
  onEdit,
}) => {
  const { canEdit: canUpdate } = useTablePermissions('competitions');

  const getPlacementBadge = (placement: string | null, label: string) => {
    if (!placement || placement === '-') {
      return <Badge variant="outline">Not placed</Badge>;
    }

    const getVariant = (placement: string) => {
      const num = placement.toLowerCase();
      switch (num) {
        case '1st':
        case 'first':
          return 'bg-yellow-100 text-yellow-800';
        case '2nd':
        case 'second':
          return 'bg-gray-100 text-gray-800';
        case '3rd':
        case 'third':
          return 'bg-orange-100 text-orange-800';
        default:
          return 'bg-blue-100 text-blue-800';
      }
    };

    return (
      <Badge className={getVariant(placement)}>
        {placement}
      </Badge>
    );
  };

  if (!competition) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Competition Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Competition Name</label>
                <p className="text-lg font-semibold">{competition.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-base">{formatTimeForDisplay(competition.competition_date, TIME_FORMATS.DATE_ONLY, 'UTC')}</p>
                  </div>
                </div>
                {competition.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="text-base">{competition.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overall Placements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Placements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Overall Placement</label>
                  <div className="mt-1">{getPlacementBadge(competition.overall_placement, 'Overall')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Overall Armed</label>
                  <div className="mt-1">{getPlacementBadge(competition.overall_armed_placement, 'Armed')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Overall Unarmed</label>
                  <div className="mt-1">{getPlacementBadge(competition.overall_unarmed_placement, 'Unarmed')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Armed Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Armed Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Armed Regulation</label>
                  <div className="mt-1">{getPlacementBadge(competition.armed_regulation, 'Armed Regulation')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Armed Exhibition</label>
                  <div className="mt-1">{getPlacementBadge(competition.armed_exhibition, 'Armed Exhibition')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Armed Color Guard</label>
                  <div className="mt-1">{getPlacementBadge(competition.armed_color_guard, 'Armed Color Guard')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Armed Inspection</label>
                  <div className="mt-1">{getPlacementBadge(competition.armed_inspection, 'Armed Inspection')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unarmed Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unarmed Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unarmed Regulation</label>
                  <div className="mt-1">{getPlacementBadge(competition.unarmed_regulation, 'Unarmed Regulation')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unarmed Exhibition</label>
                  <div className="mt-1">{getPlacementBadge(competition.unarmed_exhibition, 'Unarmed Exhibition')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unarmed Color Guard</label>
                  <div className="mt-1">{getPlacementBadge(competition.unarmed_color_guard, 'Unarmed Color Guard')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unarmed Inspection</label>
                  <div className="mt-1">{getPlacementBadge(competition.unarmed_inspection, 'Unarmed Inspection')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {competition.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base whitespace-pre-wrap">{competition.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {canUpdate && onEdit && (
              <Button onClick={onEdit} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};