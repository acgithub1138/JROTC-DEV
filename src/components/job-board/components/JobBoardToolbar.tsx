import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, RotateCcw, Maximize, Minimize, Download, Grid3X3, Save } from 'lucide-react';
interface JobBoardToolbarProps {
  onRefresh?: () => void;
  onResetLayout: () => void;
  onToggleFullscreen: () => void;
  onExport: () => void;
  onSave: () => void;
  hasUnsavedChanges?: boolean;
  isResetting: boolean;
  isFullscreen: boolean;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
}
export const JobBoardToolbar = ({
  onRefresh,
  onResetLayout,
  onToggleFullscreen,
  onExport,
  onSave,
  hasUnsavedChanges = false,
  isResetting,
  isFullscreen,
  snapToGrid,
  onToggleSnapToGrid
}: JobBoardToolbarProps) => {
  return <TooltipProvider>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
        {onRefresh && <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh chart</p>
            </TooltipContent>
          </Tooltip>}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onResetLayout} disabled={isResetting}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset layout</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onToggleSnapToGrid} className={snapToGrid ? 'bg-blue-50' : ''}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{snapToGrid ? 'Disable' : 'Enable'} snap to grid</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSave}
              className={hasUnsavedChanges ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
            >
              <Save className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasUnsavedChanges ? 'Save unsaved changes' : 'Save current layout'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export chart</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>;
};