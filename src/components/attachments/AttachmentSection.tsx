import React, { useState } from 'react';
import { Paperclip, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileAttachmentUpload } from './FileAttachmentUpload';
import { AttachmentList } from './AttachmentList';
import { useAttachments } from '@/hooks/attachments/useAttachments';

interface AttachmentSectionProps {
  recordType: 'task' | 'subtask' | 'incident' | 'announcement';
  recordId: string;
  canEdit?: boolean;
  defaultOpen?: boolean;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  recordType,
  recordId,
  canEdit = false,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showUpload, setShowUpload] = useState(false);
  const { uploadFile, isUploading, attachments } = useAttachments(recordType, recordId);

  const handleFileUpload = (files: File[]) => {
    files.forEach((file) => {
      uploadFile({
        record_type: recordType,
        record_id: recordId,
        file,
      });
    });
    setShowUpload(false);
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4" />
                <span>Attachments</span>
                {attachments.length > 0 && (
                  <span className="text-sm bg-muted px-2 py-1 rounded-full">
                    {attachments.length}
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <AttachmentList
                recordType={recordType}
                recordId={recordId}
                canEdit={canEdit}
              />
              {canEdit && !showUpload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpload(true)}
                  className="flex-shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Files
                </Button>
              )}
            </div>

            {showUpload && canEdit && (
              <div className="space-y-3">
                <FileAttachmentUpload
                  onFileSelect={handleFileUpload}
                  disabled={isUploading}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUpload(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};