import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MobileNavButtons } from './MobileNavButtons';
import { Search, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { convertToUI } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
interface RegisteredSchool {
  school_id: string;
  school_name: string;
  scheduled_time?: string | null;
}
interface SchoolSelectionStepProps {
  schools: RegisteredSchool[];
  submittedSchoolIds: Set<string>;
  selectedSchoolId: string | null;
  onSelect: (schoolId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isTransitioning?: boolean;
}
export const SchoolSelectionStep = ({
  schools,
  submittedSchoolIds,
  selectedSchoolId,
  onSelect,
  onNext,
  onPrevious,
  isTransitioning = false
}: SchoolSelectionStepProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { timezone } = useSchoolTimezone();
  const filteredSchools = schools
    .filter(school => !submittedSchoolIds.has(school.school_id))
    .filter(school => school.school_name.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="h-[calc(100dvh-4rem)] bg-background flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 p-6 overflow-y-auto pb-28">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-center">Select School</h1>
          <p className="text-muted-foreground text-center">Choose the school you're judging</p>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Search schools..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-12 text-base" />
        </div>
        
        <div className="space-y-2">
          {filteredSchools.map(school => {
            const isSubmitted = submittedSchoolIds.has(school.school_id);
            const isSelected = selectedSchoolId === school.school_id;
            
            const handleSelect = () => {
              if (!isSubmitted) {
                onSelect(school.school_id);
              }
            };
            
            return (
              <Card 
                key={school.school_id} 
                onClick={handleSelect}
                className={cn(
                  "p-4 transition-all touch-manipulation active:scale-[0.98]",
                  isSubmitted 
                    ? "opacity-60 cursor-not-allowed bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30"
                    : "cursor-pointer hover:border-primary",
                  !isSubmitted && isSelected && "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="flex items-center gap-3">
                  {isSubmitted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0" />
                  ) : (
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-lg font-medium">{school.school_name}</p>
                      {school.scheduled_time && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                          <Clock className="w-4 h-4" />
                          <span>{convertToUI(school.scheduled_time, timezone, 'time')}</span>
                        </div>
                      )}
                    </div>
                    {isSubmitted && (
                      <p className="text-xs text-green-700 dark:text-green-500 mt-1">Score sheet submitted</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      
      <MobileNavButtons onNext={onNext} onPrevious={onPrevious} showPrevious nextDisabled={!selectedSchoolId || isTransitioning} />
    </div>;
};