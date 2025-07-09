import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const formatCompetitionName = (comp: { name: string; competition_date: string }) => {
    const date = new Date(comp.competition_date).toLocaleDateString();
    return `${comp.name} (${date})`;
  };

  const selectedCompetitionData = selectedCompetitions 
    ? availableCompetitions.filter(comp => selectedCompetitions.includes(comp.id))
    : [];

  const filteredCompetitions = availableCompetitions.filter(comp => {
    const searchableText = formatCompetitionName(comp).toLowerCase();
    return searchableText.includes(searchTerm.toLowerCase());
  });

  const handleCompetitionToggle = (competitionId: string) => {
    if (!selectedCompetitions) {
      // If "All" was selected, clicking on a competition should deselect it
      // This means selecting all OTHER competitions
      const allOtherCompetitions = availableCompetitions
        .filter(comp => comp.id !== competitionId)
        .map(comp => comp.id);
      onCompetitionSelect(allOtherCompetitions);
    } else {
      const isSelected = selectedCompetitions.includes(competitionId);
      if (isSelected) {
        const newSelections = selectedCompetitions.filter(id => id !== competitionId);
        // Allow empty selections (don't default back to "All")
        onCompetitionSelect(newSelections);
      } else {
        const newSelections = [...selectedCompetitions, competitionId];
        // If we've selected all competitions, switch to "All" mode
        if (newSelections.length === availableCompetitions.length) {
          onCompetitionSelect(null);
        } else {
          onCompetitionSelect(newSelections);
        }
      }
    }
  };

  const handleSelectAll = () => {
    onCompetitionSelect(null); // null means all competitions
  };

  const handleRemoveCompetition = (competitionId: string) => {
    if (selectedCompetitions) {
      const newSelections = selectedCompetitions.filter(id => id !== competitionId);
      onCompetitionSelect(newSelections);
    }
  };

  const isAllSelected = !selectedCompetitions;
  const selectedCount = selectedCompetitions?.length || 0;

  const getDisplayText = () => {
    if (isAllSelected) {
      return `All Competitions (${availableCompetitions.length})`;
    }
    return `${selectedCount} Competition${selectedCount !== 1 ? 's' : ''} Selected`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Competitions</CardTitle>
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
        <CardTitle>Select Competitions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableCompetitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No competitions found. Add some competitions to see data.
          </p>
        ) : (
          <>
            {/* Collapsible competition selector */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{getDisplayText()}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="border rounded-md">
                  {/* Search and Select All */}
                  <div className="p-3 border-b">
                    <div className="flex gap-3 items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search competitions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Checkbox
                          id="select-all-competitions"
                          checked={isAllSelected}
                          onCheckedChange={() => isAllSelected ? onCompetitionSelect([]) : handleSelectAll()}
                        />
                        <Label htmlFor="select-all-competitions" className="text-sm whitespace-nowrap cursor-pointer">
                          Select All
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Competition list */}
                  <ScrollArea className="h-48">
                    <div className="p-2">
                      {filteredCompetitions.length === 0 ? (
                        <div className="text-sm text-gray-500 p-2">No competitions found.</div>
                      ) : (
                        <div className="space-y-2">
                          {filteredCompetitions.map((comp) => {
                            const isSelected = selectedCompetitions?.includes(comp.id) || false;
                            return (
                              <div
                                key={comp.id}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                              >
                                <Checkbox
                                  checked={isAllSelected || isSelected}
                                  onCheckedChange={() => handleCompetitionToggle(comp.id)}
                                />
                                <span 
                                  className="text-sm cursor-pointer flex-1"
                                  onClick={() => handleCompetitionToggle(comp.id)}
                                >
                                  {formatCompetitionName(comp)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
};