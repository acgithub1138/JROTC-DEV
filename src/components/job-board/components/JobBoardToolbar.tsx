import React from 'react';
import { RefreshCcw, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobBoardToolbarProps {
  onRefresh?: () => void;
  onResetLayout: () => void;
  onDownloadImage: () => void;
  isResetting: boolean;
}

export const JobBoardToolbar = ({ 
  onRefresh, 
  onResetLayout, 
  onDownloadImage, 
  isResetting 
}: JobBoardToolbarProps) => {
  return (
    <div className="absolute top-2 right-2 z-10 flex gap-2">
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="bg-white/90 backdrop-blur-sm"
        >
          <RefreshCcw className="w-4 h-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onResetLayout}
        disabled={isResetting}
        className="bg-white/90 backdrop-blur-sm"
        title="Reset layout to default"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onDownloadImage}
        className="bg-white/90 backdrop-blur-sm"
        title="Download as image"
      >
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
};