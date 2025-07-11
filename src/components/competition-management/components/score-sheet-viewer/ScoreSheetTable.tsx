import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import type { CompetitionEvent } from './types';
import { getFieldNames, getCleanFieldName, calculateFieldAverage, calculateTotalAverage } from './utils/fieldHelpers';
import { EditScoreSheetDialog } from './EditScoreSheetDialog';
import { useModulePermissions } from '@/hooks/usePermissions';

interface ScoreSheetTableProps {
  events: CompetitionEvent[];
  onEventsRefresh?: () => void;
}

export const ScoreSheetTable: React.FC<ScoreSheetTableProps> = ({ events, onEventsRefresh }) => {
  const [selectedEvent, setSelectedEvent] = useState<CompetitionEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { canUpdate } = useModulePermissions('competitions');
  const fieldNames = getFieldNames(events);

  const handleEditScoreSheet = (event: CompetitionEvent) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleEventUpdated = () => {
    onEventsRefresh?.();
  };

  // Get unique cadets from events
  const uniqueCadets = events.reduce((acc, event) => {
    if (event.profiles && Array.isArray(event.profiles)) {
      event.profiles.forEach(profile => {
        const fullName = `${profile.first_name} ${profile.last_name}`;
        if (!acc.includes(fullName)) {
          acc.push(fullName);
        }
      });
    }
    return acc;
  }, [] as string[]);

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No score sheets found for this event
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {uniqueCadets.length > 0 && (
        <div className="rounded-md border p-4 bg-muted/30">
          <div className="text-sm font-medium text-foreground mb-2">Cadets:</div>
          <div className="text-sm text-muted-foreground">
            {uniqueCadets.join(', ')}
          </div>
        </div>
      )}
      
      <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center bg-muted/30 px-2 min-w-20">Field</TableHead>
            {events.map((event, index) => (
              <TableHead key={event.id} className="text-center border-r px-2 min-w-24">
                <div className="space-y-1">
                  <div className="font-medium text-sm">
                    {event.score_sheet?.judge_number || `Judge ${index + 1}`}
                  </div>
                {canUpdate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditScoreSheet(event)}
                      className="h-6 w-6 p-0 hover:bg-muted"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="text-center bg-muted/30 px-2 min-w-20">
              <div className="font-medium text-sm">Average</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fieldNames.map((fieldName) => {
            const average = calculateFieldAverage(events, fieldName);

            return (
              <TableRow key={fieldName}>
                <TableCell className="sticky left-0 bg-background font-medium border-r px-2 text-sm">
                  {getCleanFieldName(fieldName)}
                </TableCell>
                {events.map((event) => (
                  <TableCell key={event.id} className="text-center border-r px-1 text-sm">
                    {(() => {
                      const value = event.score_sheet?.scores?.[fieldName];
                      if (value === null || value === undefined) return '-';
                      if (typeof value === 'object') return JSON.stringify(value);
                      return String(value);
                    })()}
                  </TableCell>
                ))}
                <TableCell className="text-center font-medium bg-muted/30 px-1 text-sm">
                  {average}
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* Total Points Row */}
          <TableRow className="bg-muted/50">
            <TableCell className="sticky left-0 bg-muted/50 font-bold border-r px-2 text-sm">
              Total Points
            </TableCell>
            {events.map((event) => (
              <TableCell key={event.id} className="text-center font-bold border-r px-1 text-sm">
                {event.total_points || 0}
              </TableCell>
            ))}
            <TableCell className="text-center font-bold bg-muted/50 px-1 text-sm">
              {calculateTotalAverage(events)}
            </TableCell>
          </TableRow>
          
          {/* Grand Total Row */}
          <TableRow className="bg-primary/10 border-t-2">
            <TableCell className="sticky left-0 bg-primary/10 font-bold border-r text-primary px-2 text-sm">
              Grand Total
            </TableCell>
            <TableCell className="text-center font-bold text-primary px-1 text-sm" colSpan={events.length + 1}>
              {events.reduce((sum, event) => sum + (event.total_points || 0), 0)} points
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </div>

      {canUpdate && (
        <EditScoreSheetDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
};