import React from 'react';
import { RefreshCcw, RotateCcw, Expand, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobBoardToolbarProps {
  onRefresh?: () => void;
  onResetLayout: () => void;
  onToggleFullscreen: () => void;
  isResetting: boolean;
  isFullscreen: boolean;
}

export const JobBoardToolbar = ({ 
  onRefresh, 
  onResetLayout, 
  onToggleFullscreen, 
  isResetting,
  isFullscreen
}: JobBoardToolbarProps) => {
  return (
    <div className="absolute top-2 right-2 z-10 flex gap-2">
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="bg-white/90 backdrop-blur-sm"
          title="Refresh Data"
        >
          <RefreshCcw className="w-4 h-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={onResetLayout}
        disabled={isResetting}
        className="bg-white/90 backdrop-blur-sm"
        title="Reset layout to default"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleFullscreen}
        className="bg-white/90 backdrop-blur-sm"
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
      </Button>
    </div>
  );
};