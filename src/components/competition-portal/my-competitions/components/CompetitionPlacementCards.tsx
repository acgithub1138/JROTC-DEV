import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Plus, Trash2, Trophy, Calendar, Eye, X } from 'lucide-react';
import { useCompetitionPlacements, type CompetitionPlacement } from '../hooks/useCompetitionPlacements';
import { useCompetitionEventTypes } from '@/components/competition-management/hooks/useCompetitionEventTypes';
import { useMyCompetitionsPermissions } from '@/hooks/useModuleSpecificPermissions';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['competitions']['Row'];
type ExtendedCompetition = Competition & {
  source_type: 'internal' | 'portal';
  source_competition_id: string;
};

interface CompetitionPlacementCardsProps {
  competitions: ExtendedCompetition[];
  isLoading: boolean;
  onEdit?: (competition: ExtendedCompetition) => void;
  onDelete?: (competition: ExtendedCompetition) => void;
  onAddEvent?: (competition: ExtendedCompetition) => void;
  onView?: (competition: ExtendedCompetition) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canAddEvent?: boolean;
}

const placementOptions = [
  { value: '1', label: '1st Place' },
  { value: '2', label: '2nd Place' },
  { value: '3', label: '3rd Place' },
  { value: '4', label: '4th Place' },
  { value: '5', label: '5th Place' },
  { value: '6', label: '6th Place' },
  { value: '7', label: '7th Place' },
  { value: '8', label: '8th Place' },
  { value: '9', label: '9th Place' },
  { value: '10', label: '10th Place' },
];

const getPlacementColor = (placement: number | null): string => {
  if (!placement) return 'bg-muted text-muted-foreground';
  
  switch (placement) {
    case 1:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 2:
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 3:
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
};

const getPlacementSuffix = (placement: number): string => {
  if (placement === 1) return 'st';
  if (placement === 2) return 'nd';
  if (placement === 3) return 'rd';
  return 'th';
};

export const CompetitionPlacementCards: React.FC<CompetitionPlacementCardsProps> = ({
  competitions,
  isLoading,
  onEdit,
  onDelete,
  onAddEvent,
  onView,
  canEdit = false,
  canDelete = false,
  canAddEvent = false
}) => {
  const {
    placements,
    createPlacement,
    updatePlacement,
    deletePlacement,
    getPlacementsForCompetition
  } = useCompetitionPlacements();

  const [editingPlacement, setEditingPlacement] = useState<{
    competitionId: string;
    source: 'internal' | 'portal';
    eventName?: string;
  } | null>(null);
  const [newEventName, setNewEventName] = useState('');
  const [newPlacement, setNewPlacement] = useState<string>('');

  // Hooks for fetching event options - only needed for internal competitions now
  const { eventTypes, isLoading: isLoadingEventTypes } = useCompetitionEventTypes();
  const { canUpdate, canViewDetails, canCreate, canDelete: canDeletePermission } = useMyCompetitionsPermissions();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg bg-card animate-pulse">
            <div className="p-4 border-b bg-muted/30">
              <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No competitions found</h3>
        <p className="text-muted-foreground">Start by adding your first competition.</p>
      </div>
    );
  }

  const handleAddPlacement = async (competitionId: string, source: 'internal' | 'portal', competition: ExtendedCompetition) => {
    if (!newEventName || !newPlacement) return;

    try {
      await createPlacement({
        competition_id: competitionId,
        competition_source: source,
        event_name: newEventName,
        placement: parseInt(newPlacement),
        competition_date: competition.competition_date
      });
      
      setEditingPlacement(null);
      setNewEventName('');
      setNewPlacement('');
    } catch (error) {
      console.error('Failed to add placement:', error);
    }
  };

  const handleUpdatePlacement = async (placementId: string, newPlacementValue: number) => {
    try {
      await updatePlacement(placementId, { placement: newPlacementValue });
    } catch (error) {
      console.error('Failed to update placement:', error);
    }
  };

  const handleDeletePlacement = async (placementId: string) => {
    try {
      await deletePlacement(placementId);
    } catch (error) {
      console.error('Failed to delete placement:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {competitions.map((competition) => {
        const competitionPlacements = getPlacementsForCompetition(
          competition.source_competition_id,
          competition.source_type
        );

        return (
          <div key={competition.id} className="border rounded-lg bg-card transition-shadow hover:shadow-md animate-fade-in flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={competition.source_type === 'internal' ? 'default' : 'secondary'}>
                  {competition.source_type === 'internal' ? 'Internal' : 'Portal'}
                </Badge>
                <div className="flex items-center gap-2">
                  {onView && canViewDetails && (
                    <Button variant="default" size="sm" onClick={() => onView(competition)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Scores
                    </Button>
                  )}
                  <div className="flex items-center gap-1">
                    {onEdit && competition.source_type === 'internal' && canUpdate && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(competition)} title="Edit Competition">
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onAddEvent && canCreate && (
                      <Button variant="ghost" size="sm" onClick={() => onAddEvent(competition)} title="Add Event">
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && competition.source_type === 'internal' && canDeletePermission && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(competition)} title="Delete Competition">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <h3 
                className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors mb-2"
                onClick={() => onView?.(competition)}
              >
                {competition.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(competition.competition_date).toLocaleDateString()}
              </div>
            </div>
            
            {/* Placements and Controls Row */}
            <div className="p-4">
              {/* Existing Placements */}
              {competitionPlacements.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Placements</h4>
                  <div className="flex flex-wrap gap-2">
                    {competitionPlacements.map((placement) => (
                       <div key={placement.id} className="relative flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg min-w-0">
                         {/* Only show delete button for internal competitions */}
                         {canUpdate && competition.source_type === 'internal' && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleDeletePlacement(placement.id)}
                             className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-background hover:bg-destructive hover:text-destructive-foreground shadow-sm"
                           >
                             <X className="w-3 h-3" />
                           </Button>
                         )}
                         <span className="text-sm font-medium text-center">{placement.event_name}</span>
                         <Badge className={getPlacementColor(placement.placement)}>
                           {placement.placement ? `${placement.placement}${getPlacementSuffix(placement.placement)}` : 'N/A'}
                         </Badge>
                       </div>
                     ))}
                  </div>
                  {/* Show note for Portal competitions */}
                  {competition.source_type === 'portal' && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Placements auto-generated from competition results
                    </p>
                  )}
                </div>
              )}

              {/* Add New Placement - Only for Internal competitions */}
              {competition.source_type === 'internal' && canUpdate && editingPlacement?.competitionId === competition.source_competition_id && 
               editingPlacement?.source === competition.source_type ? (
                <div className="space-y-2 p-3 border rounded-lg bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Event Name Dropdown - Only show event types for internal */}
                    <Select value={newEventName} onValueChange={setNewEventName}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingEventTypes ? (
                          <SelectItem value="loading-types" disabled>Loading event types...</SelectItem>
                        ) : eventTypes.length > 0 ? (
                          eventTypes.map((eventType) => (
                            <SelectItem key={eventType.id} value={eventType.name}>
                              {eventType.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-types" disabled>No event types available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Select value={newPlacement} onValueChange={setNewPlacement}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select placement" />
                      </SelectTrigger>
                      <SelectContent>
                        {placementOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddPlacement(competition.source_competition_id, competition.source_type, competition)}
                    >
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPlacement(null);
                        setNewEventName('');
                        setNewPlacement('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : competition.source_type === 'internal' && canUpdate ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPlacement({
                    competitionId: competition.source_competition_id,
                    source: competition.source_type
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Placement
                </Button>
              ) : competition.source_type === 'portal' && competitionPlacements.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Placements will be auto-generated when competition is completed
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
