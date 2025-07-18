import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Download, 
  Grid3X3, 
  GitBranch,
  Radar,
  List
} from 'lucide-react';

interface JobBoardToolbarProps {
  onRefresh?: () => void;
  onResetLayout: () => void;
  onToggleFullscreen: () => void;
  onExport: () => void;
  isResetting: boolean;
  isFullscreen: boolean;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  layoutAlgorithm?: 'hierarchical' | 'radial' | 'legacy';
  onLayoutAlgorithmChange?: (algorithm: 'hierarchical' | 'radial' | 'legacy') => void;
}

export const JobBoardToolbar = ({
  onRefresh,
  onResetLayout,
  onToggleFullscreen,
  onExport,
  isResetting,
  isFullscreen,
  snapToGrid,
  onToggleSnapToGrid,
  layoutAlgorithm = 'hierarchical',
  onLayoutAlgorithmChange,
}: JobBoardToolbarProps) => {
  return (
    <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
      {/* Layout Algorithm Selection */}
      <Select value={layoutAlgorithm} onValueChange={onLayoutAlgorithmChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Layout" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hierarchical">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Hierarchical
            </div>
          </SelectItem>
          <SelectItem value="radial">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4" />
              Radial
            </div>
          </SelectItem>
          <SelectItem value="legacy">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Legacy
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Existing toolbar buttons */}
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onResetLayout}
        disabled={isResetting}
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onToggleSnapToGrid}
        className={snapToGrid ? 'bg-blue-50' : ''}
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>
      
      <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
        {isFullscreen ? (
          <Minimize className="w-4 h-4" />
        ) : (
          <Maximize className="w-4 h-4" />
        )}
      </Button>
      
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
};
