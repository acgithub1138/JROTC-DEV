import React from 'react';
import { Download, Trash2, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAttachments } from '@/hooks/attachments/useAttachments';
import { formatDistance } from 'date-fns';
import type { AttachmentListProps } from '@/hooks/attachments/types';

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType === 'application/pdf') return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const AttachmentList: React.FC<AttachmentListProps> = ({
  recordType,
  recordId,
  canEdit = false,
}) => {
  const { attachments, isLoading, deleteFile, getFileUrl, isDeleting } = useAttachments(
    recordType,
    recordId
  );

  const handleDownload = async (attachment: any) => {
    try {
      const url = await getFileUrl(attachment.file_path);
      if (url) {
        // Fetch the file as a blob to ensure correct filename
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading attachments...</div>;
  }

  if (attachments.length === 0) {
    return <div className="text-sm text-muted-foreground">No attachments</div>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const IconComponent = getFileIcon(attachment.file_type);
        return (
          <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{attachment.file_name}</span>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteFile(attachment.id)}
                  disabled={isDeleting}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};