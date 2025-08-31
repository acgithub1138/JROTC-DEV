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
  showTitleWithCount?: boolean;
  showContentOnly?: boolean;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  recordType,
  recordId,
  canEdit = false,
  defaultOpen = false,
  showTitleWithCount = false,
  showContentOnly = false,
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

  if (showTitleWithCount) {
    return (
      <div className="space-y-3">
         <div className="">
           <div className="flex items-center justify-center gap-2">
             <Paperclip className="h-4 w-4" />
             <span>Attachments {attachments.length > 0 && `(${attachments.length})`}</span>
           </div>
           {canEdit && !showUpload && (
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setShowUpload(true)}
               className="h-6 w-6 p-0"
               title="Add attachment"
             >
               <Plus className="h-4 w-4" />
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
      </div>
    );
  }

  if (showContentOnly) {
    return (
      <div className="space-y-4">
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
      
      {canEdit && !showUpload && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowUpload(true)}
          className="fixed top-4 right-4 h-6 w-6 p-0 z-10"
          title="Add attachment"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};