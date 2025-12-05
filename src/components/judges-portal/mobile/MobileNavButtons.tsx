import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface MobileNavButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onExit?: () => void;
  showPrevious?: boolean;
  showExit?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  currentStep?: number;
  totalSteps?: number;
}

export const MobileNavButtons = ({
  onPrevious,
  onNext,
  onExit,
  showPrevious = false,
  showExit = false,
  nextDisabled = false,
  nextLabel = "Next",
  currentStep,
  totalSteps,
}: MobileNavButtonsProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-2 pb-safe z-50">
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Left Section - Previous/Exit Button */}
        <div>
          {showExit && onExit && (
            <Button variant="outline" size="lg" onPointerDown={onExit} className="w-full h-10 text-base touch-manipulation select-none">
              <X className="h-5 w-5 mr-2" />
            </Button>
          )}

          {showPrevious && onPrevious && (
            <Button variant="outline" size="lg" onPointerDown={onPrevious} className="w-full h-10 text-base text-left touch-manipulation select-none">
              <ChevronLeft className="h-5 w-5 mr-2" />
            </Button>
          )}
        </div>

        {/* Middle Section - Progress Indicator */}
        <div className="flex justify-center">
          {currentStep !== undefined && totalSteps !== undefined && (
            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
              {currentStep} of {totalSteps}
            </div>
          )}
        </div>

        {/* Right Section - Next Button */}
        <div>
          {onNext && (
            <Button 
              size="lg" 
              onPointerDown={(e) => {
                e.preventDefault();
                if (!nextDisabled) onNext();
              }} 
              disabled={nextDisabled} 
              className="w-full h-10 text-base text-right touch-manipulation select-none"
            >
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
