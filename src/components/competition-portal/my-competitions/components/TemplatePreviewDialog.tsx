import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatTimeForDisplay } from '@/utils/timeDisplayUtils';
import type { CompetitionTemplate } from '../types';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CompetitionTemplate | null;
}

export const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  open,
  onOpenChange,
  template
}) => {
  if (!template) return null;

  const scoreEntries = Object.entries(template.scores || {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Preview: {template.template_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Event Type</Label>
              <p className="mt-1">{template.event}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">JROTC Program</Label>
              <p className="mt-1">
                <Badge variant="outline">
                  {template.jrotc_program?.toUpperCase() || 'N/A'}
                </Badge>
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <p className="mt-1">
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {template.is_global && (
                  <Badge variant="outline" className="ml-2">
                    Global
                  </Badge>
                )}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Created</Label>
              <p className="mt-1">
                {formatTimeForDisplay(template.created_at, 'DATETIME_24H', 'UTC')}
              </p>
            </div>
          </div>

          {template.description && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md">
                {template.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Score Sheet Fields */}
          <div>
            <Label className="text-lg font-semibold">Score Sheet Fields</Label>
            
            {scoreEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No score sheet fields configured
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {scoreEntries.map(([fieldName, maxPoints], index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-center p-3 bg-muted/30 rounded-md"
                  >
                    <span className="font-medium">{fieldName}</span>
                    <Badge variant="outline">
                      Max: {maxPoints} points
                    </Badge>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-primary/10 rounded-md">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Possible Points:</span>
                    <span>
                      {scoreEntries.reduce((sum, [, points]) => 
                        sum + (typeof points === 'number' ? points : 0), 0
                      )} points
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};