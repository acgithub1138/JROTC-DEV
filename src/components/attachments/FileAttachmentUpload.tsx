import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileAttachmentUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
  className?: string;
}

const defaultAccept = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.svg'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
  'application/zip': ['.zip'],
};

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

export const FileAttachmentUpload: React.FC<FileAttachmentUploadProps> = ({
  onFileSelect,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = defaultAccept,
  disabled = false,
  className,
}) => {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...selectedFiles, ...acceptedFiles].slice(0, maxFiles);
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);
    },
    [selectedFiles, maxFiles, onFileSelect]
  );

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - selectedFiles.length,
    disabled,
  });

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-6',
          isDragActive && 'border-primary bg-primary/10',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
        </div>
      </Card>

      {fileRejections.length > 0 && (
        <div className="text-sm text-destructive space-y-1">
          {fileRejections.map(({ file, errors }, index) => (
            <div key={index}>
              {file.name}: {errors.map(e => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
          {selectedFiles.map((file, index) => {
            const IconComponent = getFileIcon(file.type);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};