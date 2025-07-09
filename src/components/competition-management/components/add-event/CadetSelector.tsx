import React from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { MultiSelectProfiles } from '../../../inventory-management/components/MultiSelectProfiles';

interface CadetSelectorProps {
  selectedCadetIds: string[];
  judgeNumber: string;
  isCadetsOpen: boolean;
  onSelectedCadetsChange: (cadetIds: string[]) => void;
  onToggleOpen: (open: boolean) => void;
}

export const CadetSelector: React.FC<CadetSelectorProps> = ({
  selectedCadetIds,
  judgeNumber,
  isCadetsOpen,
  onSelectedCadetsChange,
  onToggleOpen
}) => {
  return (
    <div className="space-y-1">
      <Collapsible open={isCadetsOpen} onOpenChange={onToggleOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                Cadets 
                {judgeNumber === 'Judge 1' && <span className="text-destructive">*</span>}
              </span>
              {selectedCadetIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({selectedCadetIds.length} selected)
                </span>
              )}
            </div>
            {isCadetsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pt-2">
          <MultiSelectProfiles 
            value={selectedCadetIds} 
            onChange={onSelectedCadetsChange} 
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};