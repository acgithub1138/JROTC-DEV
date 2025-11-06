import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScoreButtonGridProps {
  maxValue: number;
  selectedValue: number | null;
  onSelect: (value: number) => void;
  startFrom?: number;
}

export const ScoreButtonGrid = ({ 
  maxValue, 
  selectedValue, 
  onSelect,
  startFrom = 0 
}: ScoreButtonGridProps) => {
  // Always use 10 columns for all number questions
  const columns = 10;
  
  // Generate array of values from high to low
  const values = Array.from({ length: maxValue + 1 - startFrom }, (_, i) => maxValue - i);
  
  return (
    <div 
      className="grid w-full grid-cols-10 gap-1.5"
    >
      {values.map((value) => (
        <Button
          key={value}
          type="button"
          variant={selectedValue === value ? "default" : "outline"}
          size="lg"
          onClick={() => onSelect(value)}
          className={cn(
            "h-11 text-base font-bold touch-manipulation min-w-0 px-1",
            selectedValue === value && "ring-2 ring-primary ring-offset-2"
          )}
        >
          {value}
        </Button>
      ))}
    </div>
  );
};
