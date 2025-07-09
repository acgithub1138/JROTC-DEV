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
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Scoring Criteria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Select/Unselect All Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={allSelected}
            className="flex-1 text-xs"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onUnselectAll}
            disabled={noneSelected}
            className="flex-1 text-xs"
          >
            Unselect All
          </Button>
        </div>
        
        {/* Individual Criteria Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {scoringCriteria.map((criteria, index) => (
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
              {criteria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Label>
          </div>
        ))}
        </div>
      </CardContent>
    </Card>
  );
};