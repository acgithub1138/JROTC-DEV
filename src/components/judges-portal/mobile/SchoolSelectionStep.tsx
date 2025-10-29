import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MobileNavButtons } from './MobileNavButtons';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegisteredSchool {
  school_id: string;
  school_name: string;
}

interface SchoolSelectionStepProps {
  schools: RegisteredSchool[];
  selectedSchoolId: string | null;
  onSelect: (schoolId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isTransitioning?: boolean;
}

export const SchoolSelectionStep = ({
  schools,
  selectedSchoolId,
  onSelect,
  onNext,
  onPrevious,
  isTransitioning = false
}: SchoolSelectionStepProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredSchools = schools.filter(school =>
    school.school_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="h-[calc(100dvh-4rem)] bg-background flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 p-6 overflow-y-auto pb-28">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Select High School</h1>
          <p className="text-muted-foreground">Choose the school you're judging</p>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        
        <div className="space-y-2">
          {filteredSchools.map((school) => (
            <Card
              key={school.school_id}
              onClick={() => onSelect(school.school_id)}
              className={cn(
                "p-4 cursor-pointer transition-all touch-manipulation",
                "hover:border-primary",
                selectedSchoolId === school.school_id && "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0",
                  selectedSchoolId === school.school_id 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground"
                )}>
                  {selectedSchoolId === school.school_id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-lg font-medium">{school.school_name}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <MobileNavButtons
        onNext={onNext}
        onPrevious={onPrevious}
        showPrevious
        nextDisabled={!selectedSchoolId || isTransitioning}
      />
    </div>
  );
};
