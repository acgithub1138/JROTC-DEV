import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Edit, Trash2, Plus, Eye, Calendar, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';

interface CompetitionCardsProps {
  competitions: any[];
  isLoading: boolean;
  onEdit: (competition: any) => void;
  onDelete: (competition: any) => void;
  onAddEvent?: (competition: any) => void;
  onViewScoreSheets?: (competition: any) => void;
  onView?: (competition: any) => void;
  onViewSchedule?: (competition: any) => void;
  canViewDetails?: boolean;
}

const getPlacementColor = (placement: string | null) => {
  if (!placement || placement === '-') return '';
  
  const num = placement.toLowerCase();
  switch (num) {
    case '1st':
    case 'first':
      return 'bg-yellow-100 text-yellow-800 font-semibold'; // Gold
    case '2nd':
    case 'second':
      return 'bg-gray-100 text-gray-800 font-semibold'; // Silver
    case '3rd':
    case 'third':
      return 'bg-orange-100 text-orange-800 font-semibold'; // Bronze
    case '4th':
    case 'fourth':
      return 'bg-blue-100 text-blue-800 font-medium'; // Blue
    case '5th':
    case 'fifth':
      return 'bg-green-100 text-green-800 font-medium'; // Green
    default:
      return 'bg-muted text-muted-foreground font-medium';
  }
};

const PlacementBadge = ({ placement, label }: { placement: string | null; label: string }) => {
  const colorClass = getPlacementColor(placement);
  const displayValue = placement || '-';
  
  if (placement && placement !== '-') {
    return (
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}:</span>
        <Badge className={cn('text-xs', colorClass)}>
          {displayValue}
        </Badge>
      </div>
    );
  }
  
  return null;
};

export const CompetitionCards: React.FC<CompetitionCardsProps> = ({
  competitions,
  isLoading,
  onEdit,
  onDelete,
  onAddEvent,
  onViewScoreSheets,
  onView,
  onViewSchedule,
  canViewDetails = false
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No competitions found</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4">
        {competitions.map((competition) => (
          <Card key={competition.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {onView ? (
                    <CardTitle 
                      className="text-lg font-semibold line-clamp-2 text-blue-600 hover:text-blue-800 cursor-pointer underline-offset-4 hover:underline"
                      onClick={() => onView(competition)}
                    >
                      {competition.name}
                    </CardTitle>
                  ) : (
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {competition.name}
                    </CardTitle>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatTimeForDisplay(competition.competition_date, TIME_FORMATS.DATE_ONLY, 'UTC')}
                  </div>
                </div>
                 <div className="flex gap-2 ml-4">
                   {onAddEvent && (
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button variant="default" size="sm" onClick={() => onAddEvent(competition)}>
                           <Plus className="w-4 h-4" />
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Add Event Score Sheet</p>
                       </TooltipContent>
                     </Tooltip>
                   )}
                   {onViewSchedule && competition.source_type === 'portal' && (
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button variant="outline" size="sm" onClick={() => onViewSchedule(competition)}>
                           <CalendarDays className="w-4 h-4" />
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>View Schedule</p>
                       </TooltipContent>
                     </Tooltip>
                   )}
                    {onEdit && competition.source_type !== 'portal' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onEdit(competition)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Competition</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {onDelete && competition.source_type !== 'portal' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onDelete(competition)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Competition</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                 </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Placements */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Overall Results</h4>
                <div className="grid grid-cols-1 gap-2">
                  <PlacementBadge placement={competition.overall_placement} label="Overall" />
                  <PlacementBadge placement={competition.overall_armed_placement} label="Overall Armed" />
                  <PlacementBadge placement={competition.overall_unarmed_placement} label="Overall Unarmed" />
                </div>
              </div>

              {/* Armed Events */}
              {(competition.armed_regulation || competition.armed_exhibition || 
                competition.armed_color_guard || competition.armed_inspection) && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Armed Events</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <PlacementBadge placement={competition.armed_regulation} label="Regulation" />
                    <PlacementBadge placement={competition.armed_exhibition} label="Exhibition" />
                    <PlacementBadge placement={competition.armed_color_guard} label="Color Guard" />
                    <PlacementBadge placement={competition.armed_inspection} label="Inspection" />
                  </div>
                </div>
              )}

              {/* Unarmed Events */}
              {(competition.unarmed_regulation || competition.unarmed_exhibition || 
                competition.unarmed_color_guard || competition.unarmed_inspection) && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Unarmed Events</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <PlacementBadge placement={competition.unarmed_regulation} label="Regulation" />
                    <PlacementBadge placement={competition.unarmed_exhibition} label="Exhibition" />
                    <PlacementBadge placement={competition.unarmed_color_guard} label="Color Guard" />
                    <PlacementBadge placement={competition.unarmed_inspection} label="Inspection" />
                  </div>
                </div>
              )}

              {competition.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {competition.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};