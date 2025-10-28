import { Button } from '@/components/ui/button';
import { MobileNavButtons } from './MobileNavButtons';
import { cn } from '@/lib/utils';

interface JudgeNumberStepProps {
  judgeCount: number;
  selectedJudgeNumber: string | null;
  onSelect: (judgeNumber: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const JudgeNumberStep = ({
  judgeCount,
  selectedJudgeNumber,
  onSelect,
  onNext,
  onPrevious
}: JudgeNumberStepProps) => {
  const judges = Array.from({ length: judgeCount }, (_, i) => (i + 1).toString());
  
  // Calculate grid columns (max 3)
  const columns = Math.min(judgeCount, 3);
  
  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <div className="flex-1 p-6 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Select Judge Number</h1>
          <p className="text-muted-foreground">Choose your assigned judge number</p>
        </div>
        
        <div 
          className={cn(
            "grid gap-4 max-w-md mx-auto w-full",
            columns === 1 && "grid-cols-1",
            columns === 2 && "grid-cols-2",
            columns === 3 && "grid-cols-3"
          )}
        >
          {judges.map((judge) => (
            <Button
              key={judge}
              type="button"
              variant={selectedJudgeNumber === judge ? "default" : "outline"}
              onClick={() => onSelect(judge)}
              className={cn(
                "h-24 text-xl font-bold touch-manipulation",
                selectedJudgeNumber === judge && "ring-2 ring-primary ring-offset-2"
              )}
            >
              Judge {judge}
            </Button>
          ))}
        </div>
      </div>
      
      <MobileNavButtons
        onNext={onNext}
        onPrevious={onPrevious}
        showPrevious
        nextDisabled={!selectedJudgeNumber}
      />
    </div>
  );
};
