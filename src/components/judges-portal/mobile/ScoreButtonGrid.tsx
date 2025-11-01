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
  // Calculate columns based on maxValue
  // For 0-7: 2 columns, For 8+: 6 columns
  const columns = maxValue <= 7 ? 2 : 6;
  
  // Generate array of values from high to low
  const values = Array.from({ length: maxValue + 1 - startFrom }, (_, i) => maxValue - i);
  
  return (
    <div 
      className={cn(
        "grid gap-2 w-full",
        columns === 2 ? "grid-cols-2" : "grid-cols-6"
      )}
    >
      {values.map((value) => (
        <Button
          key={value}
          type="button"
          variant={selectedValue === value ? "default" : "outline"}
          size="lg"
          onClick={() => onSelect(value)}
          className={cn(
            "h-20 text-2xl font-bold touch-manipulation min-w-0",
            selectedValue === value && "ring-2 ring-primary ring-offset-2"
          )}
        >
          {value}
        </Button>
      ))}
    </div>
  );
};
