import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Download, FileText, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { inventoryItemSchema } from '../schemas/inventoryItemSchema';

interface BulkOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: any[]) => Promise<void>;
}

interface ParsedItem {
  data: any;
  errors: string[];
  isValid: boolean;
  rowNumber: number;
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
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must contain headers and at least one data row",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const parsedItems: ParsedItem[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < headers.length || !values[0]) {
          continue; // Skip empty or incomplete rows
        }

        const item: any = {};
        headers.forEach((header, index) => {
          const value = values[index];
          switch (header) {
            case 'qty_total':
            case 'qty_issued':
            case 'pending_updates':
            case 'pending_issue_changes':
            case 'pending_write_offs':
              item[header] = value ? parseInt(value) : 0;
              break;
            case 'has_serial_number':
            case 'returnable':
            case 'accountable':
              item[header] = value?.toLowerCase() === 'true';
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

        // Validate the item
        const validation = inventoryItemSchema.safeParse(item);
        const errors: string[] = [];
        
        if (!validation.success) {
          validation.error.errors.forEach(err => {
            errors.push(`${err.path.join('.')}: ${err.message}`);
          });
        }

        parsedItems.push({
          data: item,
          errors,
          isValid: validation.success,
          rowNumber: i + 1
        });
      }

      setParsedData(parsedItems);
      setShowPreview(true);

      const validCount = parsedItems.filter(item => item.isValid).length;
      const totalCount = parsedItems.length;

      toast({
        title: "CSV Parsed",
        description: `${validCount}/${totalCount} rows are valid and ready to import`,
      });

    } catch (error) {
      toast({
        title: "Parse Failed",
        description: "Failed to parse CSV file. Please check the format.",
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
                      Ready to parse. Click "Preview Data" to validate before importing.
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <Button 
                    onClick={parseCSVData}
                    disabled={!importFile}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Data
                  </Button>
                </div>
              </div>
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

                <ScrollArea className="flex-1 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Qty Total</TableHead>
                        <TableHead>Qty Issued</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((item, index) => (
                        <TableRow key={index} className={!item.isValid ? 'bg-red-50' : ''}>
                          <TableCell>{item.rowNumber}</TableCell>
                          <TableCell>
                            {item.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{item.data.item || 'N/A'}</TableCell>
                          <TableCell>{item.data.category || 'N/A'}</TableCell>
                          <TableCell>{item.data.qty_total || 0}</TableCell>
                          <TableCell>{item.data.qty_issued || 0}</TableCell>
                          <TableCell>{item.data.location || 'N/A'}</TableCell>
                          <TableCell>
                            {item.errors.length > 0 && (
                              <div className="text-xs text-red-600 space-y-1">
                                {item.errors.map((error, idx) => (
                                  <div key={idx}>{error}</div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
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