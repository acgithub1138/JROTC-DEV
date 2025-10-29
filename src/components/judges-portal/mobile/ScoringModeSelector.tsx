import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ScoringMode = 'manual' | 'auto';

interface ScoringModeSelectorProps {
  selectedMode: ScoringMode;
  onModeChange: (mode: ScoringMode) => void;
}

export const ScoringModeSelector = ({
  selectedMode,
  onModeChange
}: ScoringModeSelectorProps) => {
  return (
    <div className="mt-8 max-w-md mx-auto w-full">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold mb-1">Scoring</h2>
        <p className="text-sm text-muted-foreground">Choose how to advance through questions</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant={selectedMode === 'manual' ? 'default' : 'outline'}
          onClick={() => onModeChange('manual')}
          className={cn(
            'h-20 text-lg font-semibold touch-manipulation flex flex-col gap-1',
            selectedMode === 'manual' && 'ring-2 ring-primary ring-offset-2'
          )}
        >
          <span>Manual</span>
          <span className="text-xs font-normal opacity-80">Tap Next</span>
        </Button>
        
        <Button
          type="button"
          variant={selectedMode === 'auto' ? 'default' : 'outline'}
          onClick={() => onModeChange('auto')}
          className={cn(
            'h-20 text-lg font-semibold touch-manipulation flex flex-col gap-1',
            selectedMode === 'auto' && 'ring-2 ring-primary ring-offset-2'
          )}
        >
          <span>Auto</span>
          <span className="text-xs font-normal opacity-80">Auto Advance</span>
        </Button>
      </div>
    </div>
  );
};
