import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TemplateForm } from './TemplateForm';
import { CompetitionTemplate } from '../types';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: CompetitionTemplate | null;
  onSubmit: (data: any) => Promise<void>;
}

export const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  onSubmit,
}) => {
  const [useBuilder, setUseBuilder] = useState(true);

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle>
            {template ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setUseBuilder(!useBuilder)}
          >
            {useBuilder ? 'Manual JSON' : 'Field Builder'}
          </Button>
        </DialogHeader>
        <TemplateForm
          template={template}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          useBuilder={useBuilder}
        />
      </DialogContent>
    </Dialog>
  );
};