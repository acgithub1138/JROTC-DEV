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
  onView?: (competition: any) => void;
  visibleColumns?: string[];
  canViewDetails?: boolean;
}
const getPlacementColor = (placement: string | null) => {
  if (!placement || placement === '-') return '';
  const num = placement.toLowerCase();
  switch (num) {
    case '1st':
    case 'first':
      return 'bg-yellow-100 text-yellow-800 font-semibold';
    // Gold
    case '2nd':
    case 'second':
      return 'bg-gray-100 text-gray-800 font-semibold';
    // Silver
    case '3rd':
    case 'third':
      return 'bg-orange-100 text-orange-800 font-semibold';
    // Bronze
    case '4th':
    case 'fourth':
      return 'bg-blue-100 text-blue-800 font-medium';
    // Blue
    case '5th':
    case 'fifth':
      return 'bg-green-100 text-green-800 font-medium';
    // Green
    case '6th':
    case 'sixth':
      return 'bg-purple-100 text-purple-800 font-medium';
    // Purple
    case '7th':
    case 'seventh':
      return 'bg-pink-100 text-pink-800 font-medium';
    // Pink
    case '8th':
    case 'eighth':
      return 'bg-indigo-100 text-indigo-800 font-medium';
    // Indigo
    default:
      return 'bg-muted text-muted-foreground font-medium';
    // Default for other placements
  }
};
const PlacementCell = ({
  placement
}: {
  placement: string | null;
}) => {
  const colorClass = getPlacementColor(placement);
  const displayValue = placement || '-';
  if (placement && placement !== '-') {
    return <span className={cn('px-2 py-1 rounded-md text-sm', colorClass)}>
        {displayValue}
      </span>;
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
  onView,
  visibleColumns = [],
  canViewDetails = false
}) => {
  const isMobile = useIsMobile();

  // Helper function to check if a column is visible
  const isColumnVisible = (columnKey: string) => {
    if (!visibleColumns || visibleColumns.length === 0) {
      return true; // Show all columns by default when no preferences loaded
    }
    return visibleColumns.includes(columnKey);
  };

  // Show cards on mobile, table on desktop
  if (isMobile) {
    return <CompetitionCards competitions={competitions} isLoading={isLoading} onEdit={onEdit} onDelete={onDelete} onAddEvent={onAddEvent} onViewScoreSheets={onViewScoreSheets} onView={onView} canViewDetails={canViewDetails} />;
  }
  if (isLoading) {
    return <div className="p-4">Loading competitions...</div>;
  }
  if (competitions.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No competitions found</div>;
  }
  return <TooltipProvider>
      <Card>
        <CardContent className="p-0">
          <Table>
          <TableHeader>
            <TableRow>
              {isColumnVisible('name') && <TableHead>Name</TableHead>}
              {isColumnVisible('date') && <TableHead>Date</TableHead>}
              {isColumnVisible('overall_placement') && <TableHead>Overall Placement</TableHead>}
              {isColumnVisible('overall_armed_placement') && <TableHead>Overall Armed</TableHead>}
              {isColumnVisible('overall_unarmed_placement') && <TableHead>Overall Unarmed</TableHead>}
              {isColumnVisible('armed_regulation') && <TableHead>Armed Regulation</TableHead>}
              {isColumnVisible('armed_exhibition') && <TableHead>Armed Exhibition</TableHead>}
              {isColumnVisible('armed_color_guard') && <TableHead>Armed Color Guard</TableHead>}
              {isColumnVisible('armed_inspection') && <TableHead>Armed Inspection</TableHead>}
              {isColumnVisible('unarmed_regulation') && <TableHead>Unarmed Regulation</TableHead>}
              {isColumnVisible('unarmed_exhibition') && <TableHead>Unarmed Exhibition</TableHead>}
              {isColumnVisible('unarmed_color_guard') && <TableHead>Unarmed Color Guard</TableHead>}
              {isColumnVisible('unarmed_inspection') && <TableHead>Unarmed Inspection</TableHead>}
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitions.map(competition => <TableRow key={competition.id}>
                {isColumnVisible('name') && (
                  <TableCell className="font-medium py-[8px]">
                    {onView ? (
                      <button
                        onClick={() => onView(competition)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer underline-offset-4 hover:underline text-left font-medium"
                      >
                        {competition.name}
                      </button>
                    ) : (
                      competition.name
                    )}
                  </TableCell>
                )}
                {isColumnVisible('date') && <TableCell>
                    {formatCompetitionDateFull(competition.competition_date)}
                  </TableCell>}
                {isColumnVisible('overall_placement') && <TableCell><PlacementCell placement={competition.overall_placement} /></TableCell>}
                {isColumnVisible('overall_armed_placement') && <TableCell><PlacementCell placement={competition.overall_armed_placement} /></TableCell>}
                {isColumnVisible('overall_unarmed_placement') && <TableCell><PlacementCell placement={competition.overall_unarmed_placement} /></TableCell>}
                {isColumnVisible('armed_regulation') && <TableCell><PlacementCell placement={competition.armed_regulation} /></TableCell>}
                {isColumnVisible('armed_exhibition') && <TableCell><PlacementCell placement={competition.armed_exhibition} /></TableCell>}
                {isColumnVisible('armed_color_guard') && <TableCell><PlacementCell placement={competition.armed_color_guard} /></TableCell>}
                {isColumnVisible('armed_inspection') && <TableCell><PlacementCell placement={competition.armed_inspection} /></TableCell>}
                {isColumnVisible('unarmed_regulation') && <TableCell><PlacementCell placement={competition.unarmed_regulation} /></TableCell>}
                {isColumnVisible('unarmed_exhibition') && <TableCell><PlacementCell placement={competition.unarmed_exhibition} /></TableCell>}
                {isColumnVisible('unarmed_color_guard') && <TableCell><PlacementCell placement={competition.unarmed_color_guard} /></TableCell>}
                {isColumnVisible('unarmed_inspection') && <TableCell><PlacementCell placement={competition.unarmed_inspection} /></TableCell>}
                <TableCell className="text-right">
                  <div className="flex items-center justify-center gap-2">
                    {onAddEvent && <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="default" size="icon" className="h-6 w-6" onClick={() => onAddEvent(competition)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Event Score Sheet</p>
                        </TooltipContent>
                       </Tooltip>}
                    {onViewScoreSheets && canViewDetails && <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onViewScoreSheets(competition)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Score Sheets</p>
                        </TooltipContent>
                       </Tooltip>}
                    {onEdit && <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onEdit(competition)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Competition</p>
                        </TooltipContent>
                      </Tooltip>}
                    {onDelete && <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => onDelete(competition.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Competition</p>
                        </TooltipContent>
                      </Tooltip>}
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>;
};