import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CompetitionEvent } from './types';
import { getFieldNames, getCleanFieldName, calculateFieldAverage, calculateTotalAverage } from './utils/fieldHelpers';

interface ScoreSheetTableProps {
  events: CompetitionEvent[];
}

export const ScoreSheetTable: React.FC<ScoreSheetTableProps> = ({ events }) => {
  const fieldNames = getFieldNames(events);

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No score sheets found for this event
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Field</TableHead>
            {events.map((event, index) => (
              <TableHead key={event.id} className="text-center min-w-32">
                <div className="space-y-1">
                  <div className="font-medium">
                    {event.score_sheet?.judge_number || `Judge ${index + 1}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total: {event.total_points || 0} pts
                  </div>
                </div>
              </TableHead>
            ))}
            <TableHead className="text-center min-w-32 bg-muted/30">
              <div className="font-medium">Average</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fieldNames.map((fieldName) => {
            const average = calculateFieldAverage(events, fieldName);

            return (
              <TableRow key={fieldName}>
                <TableCell className="sticky left-0 bg-background font-medium border-r">
                  {getCleanFieldName(fieldName)}
                </TableCell>
                {events.map((event) => (
                  <TableCell key={event.id} className="text-center">
                    {(() => {
                      const value = event.score_sheet?.scores?.[fieldName];
                      if (value === null || value === undefined) return '-';
                      if (typeof value === 'object') return JSON.stringify(value);
                      return String(value);
                    })()}
                  </TableCell>
                ))}
                <TableCell className="text-center font-medium bg-muted/30">
                  {average}
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* Total Points Row */}
          <TableRow className="bg-muted/50">
            <TableCell className="sticky left-0 bg-muted/50 font-bold border-r">
              Total Points
            </TableCell>
            {events.map((event) => (
              <TableCell key={event.id} className="text-center font-bold">
                {event.total_points || 0}
              </TableCell>
            ))}
            <TableCell className="text-center font-bold bg-muted/50">
              {calculateTotalAverage(events)}
            </TableCell>
          </TableRow>
          
          {/* Grand Total Row */}
          <TableRow className="bg-primary/10 border-t-2">
            <TableCell className="sticky left-0 bg-primary/10 font-bold border-r text-primary">
              Grand Total
            </TableCell>
            <TableCell className="text-center font-bold text-primary" colSpan={events.length + 1}>
              {events.reduce((sum, event) => sum + (event.total_points || 0), 0)} points
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};