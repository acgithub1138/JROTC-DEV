
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RecordSelector } from './components/RecordSelector';
import { PreviewContent } from './components/PreviewContent';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  sourceTable: string;
  templateId?: string;
}

export const EmailPreviewDialog: React.FC<EmailPreviewDialogProps> = ({
  open,
  onOpenChange,
  subject,
  body,
  sourceTable,
  templateId,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecordData, setSelectedRecordData] = useState<any>(null);

  const handleRecordSelect = (recordId: string, recordData: any) => {
    setSelectedRecordId(recordId);
    setSelectedRecordData(recordData);
  };

  const handleClose = () => {
    setSelectedRecordId(null);
    setSelectedRecordData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Email Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {sourceTable && (
            <RecordSelector
              tableName={sourceTable}
              selectedRecordId={selectedRecordId}
              onRecordSelect={handleRecordSelect}
            />
          )}

          <PreviewContent
            subject={subject}
            body={body}
            recordData={selectedRecordData}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
