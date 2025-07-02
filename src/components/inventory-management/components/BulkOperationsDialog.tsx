import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      'item_id', 'item', 'category', 'sub_category', 'size', 'gender',
      'qty_total', 'qty_issued', 'stock_number', 'unit_of_measure',
      'has_serial_number', 'model_number', 'returnable', 'accountable',
      'description', 'condition', 'location', 'notes'
    ];

    const sampleData = [
      'ITEM001', 'Uniform Shirt', 'Clothing', 'Shirts', 'M', 'M',
      '50', '10', 'STOCK001', 'EA',
      'false', 'MODEL123', 'true', 'true',
      'Blue dress shirt', 'New', 'Storage Room A', 'Standard issue'
    ];

    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

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
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const processCSVImport = async () => {
    if (!importFile) return;

    setIsProcessing(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const items = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length && values[0]) {
          const item: any = {};
          headers.forEach((header, index) => {
            const value = values[index];
            switch (header) {
              case 'qty_total':
              case 'qty_issued':
              case 'pending_updates':
              case 'pending_issue_changes':
              case 'pending_write_offs':
                item[header] = parseInt(value) || 0;
                break;
              case 'has_serial_number':
              case 'returnable':
              case 'accountable':
                item[header] = value.toLowerCase() === 'true';
                break;
              case 'gender':
                item[header] = value === 'M' || value === 'F' ? value : null;
                break;
              case 'unit_of_measure':
                item[header] = value === 'EA' || value === 'PR' ? value : null;
                break;
              default:
                item[header] = value || null;
            }
          });
          items.push(item);
        }
      }

      // Import items one by one to handle errors gracefully
      let successCount = 0;
      let errorCount = 0;

      for (const item of items) {
        try {
          await onImport(item);
          successCount++;
        } catch (error) {
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
      }

    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to process CSV file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="export">Export Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4">
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
                    onChange={handleFileChange}
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
                    Ready to import. Click "Process Import" to continue.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <Button 
                  onClick={processCSVImport}
                  disabled={!importFile || isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Process Import'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Download Import Template</h3>
                <p className="text-sm text-gray-600">
                  Get a CSV template with the correct format for importing inventory items
                </p>
              </div>
              
              <Button onClick={downloadTemplate} size="lg">
                <Download className="w-5 h-5 mr-2" />
                Download CSV Template
              </Button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>Template includes all required and optional fields</p>
                <p>Follow the format exactly for successful imports</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};