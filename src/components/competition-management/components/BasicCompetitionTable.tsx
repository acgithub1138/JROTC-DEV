import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CompetitionCards } from './CompetitionCards';
import { formatCompetitionDateFull } from '@/utils/dateUtils';
import type { ColumnPreference } from '@/hooks/useColumnPreferences';

interface BasicCompetitionTableProps {
  competitions: any[];
  isLoading: boolean;
  onEdit: (competition: any) => void;
  onDelete: (id: string) => void;
  onAddEvent?: (competition: any) => void;
  onViewScoreSheets?: (competition: any) => void;
  enabledColumns?: ColumnPreference[];
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
    case '6th':
    case 'sixth':
      return 'bg-purple-100 text-purple-800 font-medium'; // Purple
    case '7th':
    case 'seventh':
      return 'bg-pink-100 text-pink-800 font-medium'; // Pink
    case '8th':
    case 'eighth':
      return 'bg-indigo-100 text-indigo-800 font-medium'; // Indigo
    default:
      return 'bg-muted text-muted-foreground font-medium'; // Default for other placements
  }
};

const PlacementCell = ({ placement }: { placement: string | null }) => {
  const colorClass = getPlacementColor(placement);
  const displayValue = placement || '-';
  
  if (placement && placement !== '-') {
    return (
      <span className={cn('px-2 py-1 rounded-md text-sm', colorClass)}>
        {displayValue}
      </span>
    );
  }
  
  return <span>{displayValue}</span>;
};

export const BasicCompetitionTable: React.FC<BasicCompetitionTableProps> = ({
  competitions,
  isLoading,
  onEdit,
  onDelete,
  onAddEvent,
  onViewScoreSheets,
  enabledColumns = []
}) => {
  const isMobile = useIsMobile();
  
  // Helper function to check if a column is enabled
  const isColumnEnabled = (columnKey: string) => {
    const column = enabledColumns.find(col => col.key === columnKey);
    return column ? column.enabled : true; // Default to true if no column preferences
  };

  // Show cards on mobile, table on desktop
  if (isMobile) {
    return (
      <CompetitionCards
        competitions={competitions}
        isLoading={isLoading}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddEvent={onAddEvent}
        onViewScoreSheets={onViewScoreSheets}
      />
    );
  }

  if (isLoading) {
    return <div className="p-4">Loading competitions...</div>;
  }

  if (competitions.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No competitions found</div>;
  }

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-0">
          <Table>
          <TableHeader>
            <TableRow>
              {isColumnEnabled('name') && <TableHead>Name</TableHead>}
              {isColumnEnabled('date') && <TableHead>Date</TableHead>}
              {isColumnEnabled('overall_placement') && <TableHead>Overall Placement</TableHead>}
              {isColumnEnabled('overall_armed_placement') && <TableHead>Overall Armed</TableHead>}
              {isColumnEnabled('overall_unarmed_placement') && <TableHead>Overall Unarmed</TableHead>}
              {isColumnEnabled('armed_regulation') && <TableHead>Armed Regulation</TableHead>}
              {isColumnEnabled('armed_exhibition') && <TableHead>Armed Exhibition</TableHead>}
              {isColumnEnabled('armed_color_guard') && <TableHead>Armed Color Guard</TableHead>}
              {isColumnEnabled('armed_inspection') && <TableHead>Armed Inspection</TableHead>}
              {isColumnEnabled('unarmed_regulation') && <TableHead>Unarmed Regulation</TableHead>}
              {isColumnEnabled('unarmed_exhibition') && <TableHead>Unarmed Exhibition</TableHead>}
              {isColumnEnabled('unarmed_color_guard') && <TableHead>Unarmed Color Guard</TableHead>}
              {isColumnEnabled('unarmed_inspection') && <TableHead>Unarmed Inspection</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitions.map((competition) => (
              <TableRow key={competition.id}>
                {isColumnEnabled('name') && <TableCell className="font-medium">{competition.name}</TableCell>}
                {isColumnEnabled('date') && (
                  <TableCell>
                    {formatCompetitionDateFull(competition.competition_date)}
                  </TableCell>
                )}
                {isColumnEnabled('overall_placement') && <TableCell><PlacementCell placement={competition.overall_placement} /></TableCell>}
                {isColumnEnabled('overall_armed_placement') && <TableCell><PlacementCell placement={competition.overall_armed_placement} /></TableCell>}
                {isColumnEnabled('overall_unarmed_placement') && <TableCell><PlacementCell placement={competition.overall_unarmed_placement} /></TableCell>}
                {isColumnEnabled('armed_regulation') && <TableCell><PlacementCell placement={competition.armed_regulation} /></TableCell>}
                {isColumnEnabled('armed_exhibition') && <TableCell><PlacementCell placement={competition.armed_exhibition} /></TableCell>}
                {isColumnEnabled('armed_color_guard') && <TableCell><PlacementCell placement={competition.armed_color_guard} /></TableCell>}
                {isColumnEnabled('armed_inspection') && <TableCell><PlacementCell placement={competition.armed_inspection} /></TableCell>}
                {isColumnEnabled('unarmed_regulation') && <TableCell><PlacementCell placement={competition.unarmed_regulation} /></TableCell>}
                {isColumnEnabled('unarmed_exhibition') && <TableCell><PlacementCell placement={competition.unarmed_exhibition} /></TableCell>}
                {isColumnEnabled('unarmed_color_guard') && <TableCell><PlacementCell placement={competition.unarmed_color_guard} /></TableCell>}
                {isColumnEnabled('unarmed_inspection') && <TableCell><PlacementCell placement={competition.unarmed_inspection} /></TableCell>}
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
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
                    {onViewScoreSheets && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onViewScoreSheets(competition)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Score Sheets</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => onDelete(competition.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Competition</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};