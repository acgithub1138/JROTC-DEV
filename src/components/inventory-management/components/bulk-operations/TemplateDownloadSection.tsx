import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface TemplateDownloadSectionProps {
  onDownloadTemplate: () => void;
}

export const TemplateDownloadSection: React.FC<TemplateDownloadSectionProps> = ({
  onDownloadTemplate,
}) => {
  return (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Download Import Template</h3>
        <p className="text-sm text-gray-600">
          Get a CSV template with the correct format for importing inventory items
        </p>
      </div>
      
      <Button onClick={onDownloadTemplate} size="lg">
        <Download className="w-5 h-5 mr-2" />
        Download CSV Template
      </Button>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>Template includes all required and optional fields</p>
        <p>Follow the format exactly for successful imports</p>
      </div>
    </div>
  );
};