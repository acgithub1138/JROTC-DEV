import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = Database['public']['Enums']['comp_event_type'];

interface ChartLegendProps {
  scoringCriteria: string[];
  visibleCriteria: string[];
  onCriteriaToggle: (criteria: string) => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
}

const EVENT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0',
  '#8dd1e1', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

export const ChartLegend: React.FC<ChartLegendProps> = ({
  scoringCriteria,
  visibleCriteria,
  onCriteriaToggle,
  onSelectAll,
  onUnselectAll
}) => {
  const allSelected = scoringCriteria.length > 0 && visibleCriteria.length === scoringCriteria.length;
  const noneSelected = visibleCriteria.length === 0;
  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Scoring Criteria</CardTitle>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all-criteria"
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  const checkbox = el.querySelector('button') as HTMLButtonElement & { indeterminate?: boolean };
                  if (checkbox) checkbox.indeterminate = visibleCriteria.length > 0 && !allSelected;
                }
              }}
              onCheckedChange={() => {
                if (allSelected) {
                  onUnselectAll();
                } else {
                  onSelectAll();
                }
              }}
            />
            <Label htmlFor="select-all-criteria" className="text-xs cursor-pointer">
              Select All
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        
        {/* Individual Criteria Checkboxes */}
        <div className="grid grid-cols-1 gap-3 overflow-y-auto h-full">
        {[...scoringCriteria]
          .sort((a, b) => {
            // Extract number from beginning of criteria strings
            const getNumber = (str: string) => {
              const match = str.match(/^(\d+)\./);
              return match ? parseInt(match[1]) : 999; // Penalty fields go to end (999)
            };
            return getNumber(a) - getNumber(b);
          })
          .map((criteria, index) => (
          <div key={criteria} className="flex items-center space-x-2">
            <Checkbox
              id={`legend-${criteria}`}
              checked={visibleCriteria.includes(criteria)}
              onCheckedChange={() => onCriteriaToggle(criteria)}
            />
            <div 
              className="w-4 h-2 rounded"
              style={{ backgroundColor: EVENT_COLORS[index % EVENT_COLORS.length] }}
            />
            <Label 
              htmlFor={`legend-${criteria}`} 
              className="text-xs font-normal cursor-pointer"
            >
              {criteria.replace(/_/g, ' ')}
            </Label>
          </div>
        ))}
        </div>
      </CardContent>
    </Card>
  );
};