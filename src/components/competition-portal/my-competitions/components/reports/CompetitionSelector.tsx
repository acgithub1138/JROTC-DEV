import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { convertToUI } from '@/utils/timezoneUtils';

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
  
  // Get latest 10 competitions sorted by date
  const latestCompetitions = competitionList
    .sort((a, b) => new Date(b.competition_date).getTime() - new Date(a.competition_date).getTime())
    .slice(0, 10);

  const selectedCompetitionDetails = latestCompetitions.filter(comp => 
    selectedCompetitions.includes(comp.id)
  );

  const handleCompetitionSelect = (competitionId: string) => {
    if (selectedCompetitions.includes(competitionId)) {
      // Remove if already selected
      if (onCompetitionSelect) {
        onCompetitionSelect(prev => prev.filter(id => id !== competitionId));
      }
    } else if (selectedCompetitions.length < 5) {
      // Add if not at limit
      if (onCompetitionSelect) {
        onCompetitionSelect(prev => [...prev, competitionId]);
      }
    }
  };

  const removeCompetition = (competitionId: string) => {
    if (onCompetitionSelect) {
      onCompetitionSelect(prev => prev.filter(id => id !== competitionId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Select Competitions (up to 5):
        </label>
        
        {/* Selected competitions display */}
        {selectedCompetitionDetails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCompetitionDetails.map((competition) => (
              <Badge key={competition.id} variant="secondary" className="flex items-center gap-1">
                <span className="text-xs">
                  {competition.name} - {convertToUI(competition.competition_date, 'UTC', 'date')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeCompetition(competition.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Dropdown selector */}
        <Select onValueChange={handleCompetitionSelect} disabled={isLoading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              selectedCompetitions.length >= 5 
                ? "Maximum 5 competitions selected" 
                : "Choose a competition..."
            } />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50">
            {latestCompetitions.map((competition) => (
              <SelectItem
                key={competition.id}
                value={competition.id}
                disabled={selectedCompetitions.includes(competition.id) || selectedCompetitions.length >= 5}
                className="cursor-pointer"
              >
                <span className="font-medium">
                  {competition.name} - {convertToUI(competition.competition_date, 'UTC', 'date')}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (onCompetitionSelect) {
                const latest5 = latestCompetitions.slice(0, 5).map(comp => comp.id);
                onCompetitionSelect(latest5);
              }
            }}
            disabled={isLoading}
          >
            Select Latest 5
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onUnselectAll}
            disabled={isLoading || selectedCompetitions.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};