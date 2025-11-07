import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Users, X } from "lucide-react";

interface Judge {
  id: string;
  name: string;
}

interface MultiSelectJudgesProps {
  judges: Judge[];
  selectedJudgeIds: string[];
  onChange: (judgeIds: string[]) => void;
  disabled?: boolean;
}

export const MultiSelectJudges: React.FC<MultiSelectJudgesProps> = ({
  judges,
  selectedJudgeIds,
  onChange,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredJudges = judges.filter((judge) => judge.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedJudges = judges.filter((judge) => selectedJudgeIds.includes(judge.id));

  const handleToggleJudge = (judgeId: string) => {
    if (disabled) return;

    if (selectedJudgeIds.includes(judgeId)) {
      onChange(selectedJudgeIds.filter((id) => id !== judgeId));
    } else {
      onChange([...selectedJudgeIds, judgeId]);
    }
  };

  const handleRemove = (judgeId: string) => {
    if (disabled) return;
    onChange(selectedJudgeIds.filter((id) => id !== judgeId));
  };

  return (
    <div className="space-y-3">
      {/* Selected Judges Display */}
      {selectedJudges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedJudges.map((judge) => (
            <Badge key={judge.id} variant="secondary" className="gap-1 text-lg">
              {judge.name}
              {!disabled && (
                <button type="button" onClick={() => handleRemove(judge.id)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Collapsible Selector */}
      {!disabled && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Add Judge</span>
                {selectedJudgeIds.length > 0 && (
                  <span className="text-sm text-muted-foreground">({selectedJudgeIds.length} selected)</span>
                )}
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <Input
              type="text"
              placeholder="Search judges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-md p-2">
              {filteredJudges.length > 0 ? (
                filteredJudges.map((judge) => (
                  <div key={judge.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md">
                    <Checkbox
                      checked={selectedJudgeIds.includes(judge.id)}
                      onCheckedChange={() => handleToggleJudge(judge.id)}
                    />
                    <div className="flex-1 cursor-pointer">{judge.name}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  {searchTerm ? "No judges found" : "No judges available"}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
