import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChartLegendProps {
  criteria?: string[];
  scoringCriteria?: string[];
  visibleCriteria: string[];
  criteriaColors?: Record<string, string>;
  onToggle?: (criteria: string) => void;
  onCriteriaToggle?: (criteria: string) => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  criteria,
  scoringCriteria,
  visibleCriteria,
  criteriaColors = {},
  onToggle,
  onCriteriaToggle,
  onSelectAll,
  onUnselectAll
}) => {
  const sortCriteriaByNumber = (criteria: string[]): string[] => {
    return [...criteria].sort((a, b) => {
      const aNum = parseFloat(a.match(/^\d+/)?.[0] || '');
      const bNum = parseFloat(b.match(/^\d+/)?.[0] || '');
      
      // If both start with numbers, sort numerically
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      // If only one starts with a number, number comes first
      if (!isNaN(aNum) && isNaN(bNum)) return -1;
      if (isNaN(aNum) && !isNaN(bNum)) return 1;
      
      // If neither starts with a number, sort alphabetically
      return a.localeCompare(b);
    });
  };

  const criteriaList = sortCriteriaByNumber(criteria || scoringCriteria || []);
  const handleToggle = onToggle || onCriteriaToggle || (() => {});
  return (
    <ScrollArea className="h-[450px]">
      <div className="space-y-4 p-1">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Show All
          </Button>
          <Button variant="outline" size="sm" onClick={onUnselectAll}>
            Hide All
          </Button>
        </div>
        
        <div className="space-y-2">
          {criteriaList.map((criterion) => (
            <div key={criterion} className="flex items-center space-x-2">
              <Checkbox
                id={criterion}
                checked={visibleCriteria.includes(criterion)}
                onCheckedChange={() => handleToggle(criterion)}
              />
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: criteriaColors[criterion] || '#8884d8' }}
                />
                <label
                  htmlFor={criterion}
                  className="text-sm cursor-pointer truncate"
                  title={criterion}
                >
                  {criterion}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};