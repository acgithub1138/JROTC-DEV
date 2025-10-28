import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MobileNavButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onExit?: () => void;
  showPrevious?: boolean;
  showExit?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export const MobileNavButtons = ({
  onPrevious,
  onNext,
  onExit,
  showPrevious = false,
  showExit = false,
  nextDisabled = false,
  nextLabel = "Next"
}: MobileNavButtonsProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-between gap-4 safe-area-bottom z-50">
      {showExit && onExit && (
        <Button
          variant="outline"
          size="lg"
          onClick={onExit}
          className="flex-1 h-14 text-base"
        >
          <X className="h-5 w-5 mr-2" />
          Exit
        </Button>
      )}
      
      {showPrevious && onPrevious && (
        <Button
          variant="outline"
          size="lg"
          onClick={onPrevious}
          className="flex-1 h-14 text-base"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </Button>
      )}
      
      {onNext && (
        <Button
          size="lg"
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 h-14 text-base"
        >
          {nextLabel}
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      )}
    </div>
  );
};
