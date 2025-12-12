import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Undo2, Redo2, Monitor, Smartphone, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { useEmailBuilderStore, ViewMode, PreviewMode } from './EmailBuilderContext';

interface EmailBuilderToolbarProps {
  onOpenSettings?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const EmailBuilderToolbar: React.FC<EmailBuilderToolbarProps> = ({ 
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen 
}) => {
  const { 
    viewMode, 
    setViewMode, 
    previewMode, 
    setPreviewMode, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    setSelectedBlockId 
  } = useEmailBuilderStore();

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          className="h-8 w-8 p-0"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          className="h-8 w-8 p-0"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        
        <div className="h-4 w-px bg-border mx-2" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSelectedBlockId(null)}
          className="h-8 px-3 text-xs"
        >
          <Settings className="h-3 w-3 mr-1" />
          Email Settings
        </Button>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList className="h-8">
          <TabsTrigger value="editor" className="text-xs px-3 h-6">Editor</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs px-3 h-6">Preview</TabsTrigger>
          <TabsTrigger value="html" className="text-xs px-3 h-6">HTML</TabsTrigger>
          <TabsTrigger value="json" className="text-xs px-3 h-6">JSON</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        {viewMode === 'preview' && (
          <ToggleGroup 
            type="single" 
            value={previewMode} 
            onValueChange={(v) => v && setPreviewMode(v as PreviewMode)}
            className="h-8"
          >
            <ToggleGroupItem value="desktop" className="h-8 w-8 p-0">
              <Monitor className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" className="h-8 w-8 p-0">
              <Smartphone className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        
        {onToggleFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            className="h-8 w-8 p-0"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
