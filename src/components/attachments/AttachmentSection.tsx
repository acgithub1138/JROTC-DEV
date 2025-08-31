import React, { useState } from 'react';
import { Paperclip, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="relative">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-base">
          <Paperclip className="h-4 w-4" />
          <span>
            Attachments {attachments.length > 0 && `(${attachments.length})`}
          </span>
        </CardTitle>
        {canEdit && !showUpload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUpload(true)}
            className="absolute top-4 right-4 h-6 w-6 p-0"
            title="Add attachment"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <AttachmentList
          recordType={recordType}
          recordId={recordId}
          canEdit={canEdit}
        />

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
    </Card>
  );
};