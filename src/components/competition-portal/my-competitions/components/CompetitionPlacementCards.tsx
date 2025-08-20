import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Edit, Plus, Trash2, Trophy, Calendar, MapPin } from 'lucide-react';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useCompetitionPlacements, type CompetitionPlacement } from '../hooks/useCompetitionPlacements';
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

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {competitions.map((competition) => {
        const competitionPlacements = getPlacementsForCompetition(
          competition.source_competition_id,
          competition.source_type
        );

        return (
          <Card key={competition.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle 
                    className="text-lg cursor-pointer hover:text-primary"
                    onClick={() => onView?.(competition)}
                  >
                    {competition.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(competition.competition_date).toLocaleDateString()}
                  </div>
                  {competition.location && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {competition.location}
                    </div>
                  )}
                </div>
                <Badge variant={competition.source_type === 'internal' ? 'default' : 'secondary'}>
                  {competition.source_type === 'internal' ? 'Internal' : 'Portal'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Existing Placements */}
                {competitionPlacements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Placements</h4>
                    {competitionPlacements.map((placement) => (
                      <div key={placement.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge className={getPlacementColor(placement.placement)}>
                            {placement.placement ? `${placement.placement}${getPlacementSuffix(placement.placement)}` : 'N/A'}
                          </Badge>
                          <span className="text-sm">{placement.event_name}</span>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <Select
                              value={placement.placement?.toString() || ''}
                              onValueChange={(value) => handleUpdatePlacement(placement.id, parseInt(value))}
                            >
                              <SelectTrigger className="w-16 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {placementOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePlacement(placement.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Placement */}
                {canEdit && editingPlacement?.competitionId === competition.source_competition_id && 
                 editingPlacement?.source === competition.source_type ? (
                  <div className="space-y-2 p-3 border rounded-lg bg-background">
                    <Input
                      placeholder="Event name"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                    />
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
                ) : canEdit ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPlacement({
                      competitionId: competition.source_competition_id,
                      source: competition.source_type
                    })}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Placement
                  </Button>
                ) : null}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {onEdit && competition.source_type === 'internal' && canEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(competition)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onAddEvent && canAddEvent && (
                    <Button variant="outline" size="sm" onClick={() => onAddEvent(competition)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  )}
                  {onDelete && competition.source_type === 'internal' && canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => onDelete(competition)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
