import React, { useState } from 'react';
import { Plus, Download, Trash2, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileAttachmentUpload } from '@/components/attachments/FileAttachmentUpload';
import { useIncidentAttachments } from '@/hooks/incidents/useIncidentAttachments';

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType === 'application/pdf') return FileText;
  return File;
};

interface IncidentAttachmentSectionProps {
  incidentId: string;
  canEdit?: boolean;
  defaultOpen?: boolean;
  showTitleWithCount?: boolean;
  showContentOnly?: boolean;
}

const IncidentAttachmentList: React.FC<{ incidentId: string; canEdit: boolean }> = ({ 
  incidentId, 
  canEdit 
}) => {
  const { attachments, isLoading, deleteFile, getFileUrl, isDeleting } = useIncidentAttachments(incidentId);

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
        );
      })}
    </div>
  );
};

export const IncidentAttachmentSection: React.FC<IncidentAttachmentSectionProps> = ({
  incidentId,
  canEdit = false,
  defaultOpen = false,
  showTitleWithCount = false,
  showContentOnly = false
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const {
    uploadFile,
    isUploading,
    attachments
  } = useIncidentAttachments(incidentId);

  const handleFileUpload = (files: File[]) => {
    files.forEach(file => {
      uploadFile({
        record_type: 'incident',
        record_id: incidentId,
        file
      });
    });
    setShowUpload(false);
  };

  if (showTitleWithCount) {
    return (
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between w-full">
          <span>Attachments {attachments.length > 0 && `(${attachments.length})`}</span>
          {canEdit && !showUpload && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowUpload(true)} 
              title="Add attachment" 
              className=""
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      
        {showUpload && canEdit && (
          <div className="space-y-3">
            <FileAttachmentUpload onFileSelect={handleFileUpload} disabled={isUploading} />
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
        <IncidentAttachmentList incidentId={incidentId} canEdit={canEdit} />

        {showUpload && canEdit && (
          <div className="space-y-3">
            <FileAttachmentUpload onFileSelect={handleFileUpload} disabled={isUploading} />
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
      <IncidentAttachmentList incidentId={incidentId} canEdit={canEdit} />

      {showUpload && canEdit && (
        <div className="space-y-3">
          <FileAttachmentUpload onFileSelect={handleFileUpload} disabled={isUploading} />
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