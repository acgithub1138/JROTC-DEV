import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface CompetitionSelectorProps {
  availableCompetitions: Array<{ id: string; name: string; competition_date: string }>;
  selectedCompetitions: string[] | null;
  onCompetitionSelect: (competitions: string[] | null) => void;
  isLoading: boolean;
}

export const CompetitionSelector: React.FC<CompetitionSelectorProps> = ({
  availableCompetitions,
  selectedCompetitions,
  onCompetitionSelect,
  isLoading
}) => {
  const handleCompetitionToggle = (competitionId: string) => {
    if (!selectedCompetitions) {
      // If "All" was selected, start with just this competition
      onCompetitionSelect([competitionId]);
    } else {
      const isSelected = selectedCompetitions.includes(competitionId);
      if (isSelected) {
        const newSelections = selectedCompetitions.filter(id => id !== competitionId);
        // If no competitions left selected, default to "All"
        onCompetitionSelect(newSelections.length === 0 ? null : newSelections);
      } else {
        onCompetitionSelect([...selectedCompetitions, competitionId]);
      }
    }
  };

  const handleSelectAll = () => {
    onCompetitionSelect(null); // null means all competitions
  };

  const handleSelectNone = () => {
    onCompetitionSelect([]);
  };

  const formatCompetitionName = (comp: { name: string; competition_date: string }) => {
    const date = new Date(comp.competition_date).toLocaleDateString();
    return `${comp.name} (${date})`;
  };

  const isAllSelected = !selectedCompetitions;
  const selectedCount = selectedCompetitions?.length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Competitions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Select Competitions</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isAllSelected}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              disabled={selectedCount === 0}
              className="text-xs"
            >
              None
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {availableCompetitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No competitions found. Add some competitions to see data.
          </p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-competitions"
                checked={isAllSelected}
                onCheckedChange={() => handleSelectAll()}
              />
              <Label htmlFor="all-competitions" className="text-sm font-medium cursor-pointer">
                All Competitions ({availableCompetitions.length})
              </Label>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              {availableCompetitions.map((comp) => {
                const isSelected = selectedCompetitions?.includes(comp.id) || false;
                return (
                  <div key={comp.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`competition-${comp.id}`}
                      checked={isAllSelected || isSelected}
                      onCheckedChange={() => handleCompetitionToggle(comp.id)}
                      disabled={isAllSelected}
                    />
                    <Label 
                      htmlFor={`competition-${comp.id}`} 
                      className="text-xs cursor-pointer"
                    >
                      {formatCompetitionName(comp)}
                    </Label>
                  </div>
                );
              })}
            </div>
            
            {selectedCount > 0 && !isAllSelected && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                {selectedCount} of {availableCompetitions.length} competitions selected
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};