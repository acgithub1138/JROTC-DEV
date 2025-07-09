import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const handleCompetitionSelect = (value: string) => {
    if (value === 'all') {
      onCompetitionSelect(null); // null means all competitions
    } else {
      onCompetitionSelect([value]);
    }
  };

  const formatCompetitionName = (comp: { name: string; competition_date: string }) => {
    const date = new Date(comp.competition_date).toLocaleDateString();
    return `${comp.name} (${date})`;
  };

  const getDisplayValue = () => {
    if (!selectedCompetitions || selectedCompetitions.length === 0) {
      return 'all';
    }
    return selectedCompetitions[0];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Competition</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Competition</CardTitle>
      </CardHeader>
      <CardContent>
        {availableCompetitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No competitions found. Add some competitions to see data.
          </p>
        ) : (
          <Select value={getDisplayValue()} onValueChange={handleCompetitionSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a competition..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competitions</SelectItem>
              {availableCompetitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {formatCompetitionName(comp)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
};