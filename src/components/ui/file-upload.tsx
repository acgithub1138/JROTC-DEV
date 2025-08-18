import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  onFileDelete?: () => void; // New prop for handling existing file deletion
  currentFileUrl?: string;
  disabled?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = "image/*",
  maxSize = 5,
  onFileSelect,
  onFileDelete,
  currentFileUrl,
  disabled = false,
  className
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }
    
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    if (selectedFile) {
      // Clear newly selected file
      setSelectedFile(null);
      onFileSelect(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (currentFileUrl && onFileDelete) {
      // Handle existing file deletion
      onFileDelete();
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const hasImage = selectedFile || currentFileUrl;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="file-upload">{label}</Label>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          hasImage ? "border-solid border-gray-200" : ""
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        {hasImage ? (
          <div className="relative">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {(selectedFile || currentFileUrl) && (
                  <img
                    src={selectedFile ? URL.createObjectURL(selectedFile) : currentFileUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded border"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile?.name || "Current logo"}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Uploaded file"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                disabled={disabled}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {!disabled && (
              <div className="mt-2 text-xs text-gray-500">
                Click to change or drag and drop a new image
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="flex flex-col items-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <div className="text-sm text-gray-600 mb-1">
                Drop your image here, or click to browse
              </div>
              <div className="text-xs text-gray-500">
                Supports: JPG, PNG, GIF (max {maxSize}MB)
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!hasImage && (
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </Button>
      )}
    </div>
  );
};