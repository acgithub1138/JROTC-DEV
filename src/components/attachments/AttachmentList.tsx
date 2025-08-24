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
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
      <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
      {attachments.map((attachment) => {
        const IconComponent = getFileIcon(attachment.file_type);
        return (
          <Card key={attachment.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)} • {' '}
                    {formatDistance(new Date(attachment.created_at), new Date(), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canEdit && (
                  <Button
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
          </Card>
        );
      })}
    </div>
  );
};