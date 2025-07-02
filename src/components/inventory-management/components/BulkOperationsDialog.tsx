import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CSVUploadSection } from './bulk-operations/CSVUploadSection';
import { DataPreviewTable } from './bulk-operations/DataPreviewTable';
import { TemplateDownloadSection } from './bulk-operations/TemplateDownloadSection';
import { FieldMappingSection } from './bulk-operations/FieldMappingSection';
import { CSVProcessor, ParsedItem, FieldMapping } from './bulk-operations/CSVProcessor';

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
  const [showMapping, setShowMapping] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
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
      setShowMapping(false);
      setCsvHeaders([]);
      setFieldMappings([]);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSVHeaders = async () => {
    if (!importFile) return;

    try {
      const { csvHeaders } = await CSVProcessor.parseCSV(importFile);
      setCsvHeaders(csvHeaders);
      
      // Generate auto mapping
      const autoMapping = CSVProcessor.generateAutoMapping(csvHeaders);
      setFieldMappings(autoMapping);
      setShowMapping(true);

      toast({
        title: "CSV Headers Loaded",
        description: `Found ${csvHeaders.length} columns. Please review the field mapping.`,
      });
    } catch (error) {
      toast({
        title: "Parse Failed",
        description: error instanceof Error ? error.message : "Failed to parse CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleMappingChange = (csvColumn: string, dbField: string | null) => {
    setFieldMappings(prev => prev.map(mapping => 
      mapping.csvColumn === csvColumn 
        ? { ...mapping, dbField }
        : mapping
    ));
  };

  const handleAutoMap = () => {
    const autoMapping = CSVProcessor.generateAutoMapping(csvHeaders);
    setFieldMappings(autoMapping);
  };

  const parseCSVData = async () => {
    if (!importFile || !fieldMappings.length) return;

    try {
      const { parsedItems, unmatchedHeaders } = await CSVProcessor.parseCSV(importFile, fieldMappings);
      
      setParsedData(parsedItems);
      setShowMapping(false);
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
    setImportProgress({ current: 0, total: validItems.length });
    
    try {
      // Import valid items one by one to handle errors gracefully
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        
        // Update progress before importing each item
        setImportProgress({ current: i, total: validItems.length });
        
        // Allow UI to update by yielding control
        await new Promise(resolve => setTimeout(resolve, 10));
        
        try {
          await onImport([item]);
          successCount++;
        } catch (error) {
          console.error('Import error:', error);
          errorCount++;
        }
      }
      
      // Final progress update
      setImportProgress({ current: validItems.length, total: validItems.length });

      toast({
        title: "Import Complete",
        description: `${successCount} items imported successfully. ${errorCount} failed.`,
      });

      if (errorCount === 0) {
        onOpenChange(false);
        setImportFile(null);
        setParsedData([]);
        setShowPreview(false);
        setShowMapping(false);
        setCsvHeaders([]);
        setFieldMappings([]);
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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="import" className="w-full flex flex-col flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="export">Export Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4 flex-1 flex flex-col">
            {!showMapping && !showPreview ? (
              <CSVUploadSection
                importFile={importFile}
                onFileChange={handleFileChange}
                onDownloadTemplate={downloadTemplate}
                onPreviewData={parseCSVHeaders}
              />
            ) : showMapping ? (
              <FieldMappingSection
                csvHeaders={csvHeaders}
                fieldMappings={fieldMappings}
                onMappingChange={handleMappingChange}
                onAutoMap={handleAutoMap}
                onProceed={parseCSVData}
                onBack={() => setShowMapping(false)}
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
                    <Button variant="outline" onClick={() => {
                      setShowPreview(false);
                      setShowMapping(true);
                    }}>
                      Back to Mapping
                    </Button>
                    <Button 
                      onClick={processCSVImport}
                      disabled={validItemsCount === 0 || isProcessing}
                    >
                      {isProcessing ? 'Importing...' : `Import ${validItemsCount} Items`}
                    </Button>
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Importing items...</span>
                      <span className="text-muted-foreground">
                        Imported {importProgress.current} of {importProgress.total} items
                      </span>
                    </div>
                    <Progress 
                      value={(importProgress.current / importProgress.total) * 100} 
                      className="w-full"
                    />
                  </div>
                )}

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