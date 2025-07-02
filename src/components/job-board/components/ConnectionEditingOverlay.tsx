import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionEditingOverlayProps {
  isVisible: boolean;
  onCancel: () => void;
}

export const ConnectionEditingOverlay = ({ isVisible, onCancel }: ConnectionEditingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
      <span className="text-sm font-medium">
        Drag from a handle to create a connection
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-auto p-1 text-primary-foreground hover:bg-primary-foreground/20"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};