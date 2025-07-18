import React from 'react';
import { RefreshCcw, RotateCcw, Expand, Minimize, Grid3X3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface JobBoardToolbarProps {
  onRefresh?: () => void;
  onResetLayout: () => void;
  onToggleFullscreen: () => void;
  onExport?: () => void;
  isResetting: boolean;
  isFullscreen: boolean;
  snapToGrid?: boolean;
  onToggleSnapToGrid?: () => void;
}
export const JobBoardToolbar = ({
  onRefresh,
  onResetLayout,
  onToggleFullscreen,
  onExport,
  isResetting,
  isFullscreen,
  snapToGrid = true,
  onToggleSnapToGrid
}: JobBoardToolbarProps) => {
  return <div className="absolute top-2 right-2 z-10 flex gap-2">
      {onRefresh && <Button variant="outline" size="icon" onClick={onRefresh} className="bg-white/90 backdrop-blur-sm" title="Refresh Data">
          <RefreshCcw className="w-4 h-4" />
        </Button>}
      
      {onToggleSnapToGrid && <Button variant="outline" size="icon" onClick={onToggleSnapToGrid} className={`bg-white/90 backdrop-blur-sm ${snapToGrid ? 'bg-primary/10 border-primary' : ''}`} title={snapToGrid ? "Disable snap to grid" : "Enable snap to grid"}>
          <Grid3X3 className="w-4 h-4" />
        </Button>}
      {onExport && <Button variant="outline" size="icon" onClick={onExport} className="bg-white/90 backdrop-blur-sm" title="Export chart">
          <Download className="w-4 h-4" />
        </Button>}
      <Button variant="outline" size="icon" onClick={onToggleFullscreen} className="bg-white/90 backdrop-blur-sm" title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
      </Button>
    </div>;
};