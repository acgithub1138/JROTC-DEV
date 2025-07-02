import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText, Eye } from 'lucide-react';

interface CSVUploadSectionProps {
  importFile: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onPreviewData: () => void;
}

export const CSVUploadSection: React.FC<CSVUploadSectionProps> = ({
  importFile,
  onFileChange,
  onDownloadTemplate,
  onPreviewData,
}) => {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="space-y-2">
          <Label htmlFor="csv-file" className="cursor-pointer">
            <span className="text-lg font-medium">Upload CSV File</span>
            <p className="text-sm text-gray-500">Select a CSV file to import inventory items</p>
          </Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={onFileChange}
            className="mt-2"
          />
        </div>
      </div>

      {importFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">{importFile.name}</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            Ready to parse. Click "Preview Data" to validate before importing.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onDownloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
        <Button 
          onClick={onPreviewData}
          disabled={!importFile}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Data
        </Button>
      </div>
    </div>
  );
};