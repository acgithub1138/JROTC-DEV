import React from 'react';
import { Download, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAttachments } from '@/hooks/attachments/useAttachments';

interface AnnouncementAttachmentsProps {
  announcementId: string;
}

export const AnnouncementAttachments: React.FC<AnnouncementAttachmentsProps> = ({
  announcementId,
}) => {
  const { attachments, isLoading, getFileUrl } = useAttachments('announcement', announcementId);

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

  if (isLoading || !attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
      <Paperclip className="w-3 h-3 text-muted-foreground" />
      <div className="flex flex-wrap gap-1">
        {attachments.map((attachment) => (
          <Button
            key={attachment.id}
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(attachment)}
            className="h-auto px-2 py-1 text-xs text-primary hover:text-primary-foreground hover:bg-primary"
          >
            <Download className="w-3 h-3 mr-1" />
            {attachment.file_name}
          </Button>
        ))}
      </div>
    </div>
  );
};