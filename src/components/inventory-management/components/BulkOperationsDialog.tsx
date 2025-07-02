import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CSVUploadSection } from './bulk-operations/CSVUploadSection';
import { DataPreviewTable } from './bulk-operations/DataPreviewTable';
import { TemplateDownloadSection } from './bulk-operations/TemplateDownloadSection';
import { CSVProcessor, ParsedItem } from './bulk-operations/CSVProcessor';

interface BulkOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: any[]) => Promise<void>;
}

export const BulkOperationsDialog: React.FC<BulkOperationsDialogProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csvContent = CSVProcessor.generateTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Use this template to format your inventory data",
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
      setParsedData([]);
      setShowPreview(false);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSVData = async () => {
    if (!importFile) return;

    try {
      const { parsedItems, unmatchedHeaders } = await CSVProcessor.parseCSV(importFile);
      
      setParsedData(parsedItems);
      setShowPreview(true);

      const validCount = parsedItems.filter(item => item.isValid).length;
      const totalCount = parsedItems.length;

      let message = `${validCount}/${totalCount} rows are valid and ready to import`;
      if (unmatchedHeaders.length > 0) {
        message += `\nNote: ${unmatchedHeaders.length} column(s) were not recognized and will be ignored`;
      }

      toast({
        title: "CSV Parsed",
        description: message,
      });

    } catch (error) {
      toast({
        title: "Parse Failed",
        description: error instanceof Error ? error.message : "Failed to parse CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const processCSVImport = async () => {
    if (!parsedData.length) return;

    const validItems = parsedData.filter(item => item.isValid).map(item => item.data);
    
    if (validItems.length === 0) {
      toast({
        title: "No Valid Items",
        description: "Please fix the validation errors before importing",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Import valid items one by one to handle errors gracefully
      let successCount = 0;
      let errorCount = 0;

      for (const item of validItems) {
        try {
          await onImport([item]);
          successCount++;
        } catch (error) {
          console.error('Import error:', error);
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `${successCount} items imported successfully. ${errorCount} failed.`,
      });

      if (errorCount === 0) {
        onOpenChange(false);
        setImportFile(null);
        setParsedData([]);
        setShowPreview(false);
      }

    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validItemsCount = parsedData.filter(item => item.isValid).length;
  const invalidItemsCount = parsedData.length - validItemsCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="import" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="export">Export Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4 h-full">
            {!showPreview ? (
              <CSVUploadSection
                importFile={importFile}
                onFileChange={handleFileChange}
                onDownloadTemplate={downloadTemplate}
                onPreviewData={parseCSVData}
              />
            ) : (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium">Data Preview</h3>
                    <div className="flex space-x-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {validItemsCount} Valid
                      </Badge>
                      {invalidItemsCount > 0 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {invalidItemsCount} Invalid
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                      Back to Upload
                    </Button>
                    <Button 
                      onClick={processCSVImport}
                      disabled={validItemsCount === 0 || isProcessing}
                    >
                      {isProcessing ? 'Importing...' : `Import ${validItemsCount} Items`}
                    </Button>
                  </div>
                </div>

                <DataPreviewTable parsedData={parsedData} />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <TemplateDownloadSection onDownloadTemplate={downloadTemplate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};