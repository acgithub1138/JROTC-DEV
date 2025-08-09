import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { formatTimeForDisplay } from '@/utils/timeDisplayUtils';

interface Competition {
  id: string;
  name: string;
  competition_date: string;
}

interface CompetitionSelectorProps {
  competitions?: Competition[];
  availableCompetitions?: Competition[];
  selectedCompetitions: string[];
  onCompetitionToggle?: (competitionId: string) => void;
  onCompetitionSelect?: React.Dispatch<React.SetStateAction<string[]>>;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  isLoading?: boolean;
}

export const CompetitionSelector: React.FC<CompetitionSelectorProps> = ({
  competitions,
  availableCompetitions,
  selectedCompetitions,
  onCompetitionToggle,
  onCompetitionSelect,
  onSelectAll,
  onUnselectAll,
  isLoading = false
}) => {
  const competitionList = competitions || availableCompetitions || [];
  const handleToggle = onCompetitionToggle || ((id: string) => {
    if (onCompetitionSelect) {
      onCompetitionSelect(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  });
  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium">Select Competitions:</label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={onUnselectAll}>
            Unselect All
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {competitionList.map((competition) => (
          <div key={competition.id} className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id={competition.id}
              checked={selectedCompetitions.includes(competition.id)}
              onCheckedChange={() => handleToggle(competition.id)}
              disabled={isLoading}
            />
            <label
              htmlFor={competition.id}
              className="text-sm cursor-pointer flex-1"
            >
              <div className="font-medium">{competition.name}</div>
              <div className="text-muted-foreground">
                {formatTimeForDisplay(competition.competition_date, 'DATE_ONLY', 'UTC')}
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};