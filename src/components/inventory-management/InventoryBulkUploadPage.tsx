import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Edit2, Trash2, AlertCircle, CheckCircle, Package, ArrowLeft } from 'lucide-react';
import { useInventoryCategories } from './hooks/useInventoryCategories';
import { useInventoryItems } from './hooks/useInventoryItems';
import type { InventoryItemFormData } from './schemas/inventoryItemSchema';

interface ParsedInventoryItem extends InventoryItemFormData {
  id: string;
  errors: string[];
  isValid: boolean;
}

type ImportStep = 'upload' | 'preview' | 'import' | 'complete';

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(header => header.trim().replace(/['"]/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim().replace(/['"]/g, ''));
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

function validateInventoryData(item: InventoryItemFormData): string[] {
  const errors: string[] = [];

  if (!item.item_id?.trim()) {
    errors.push('Item ID is required');
  }

  if (!item.item?.trim()) {
    errors.push('Item name is required');
  }

  if (!item.category?.trim()) {
    errors.push('Category is required');
  }

  if (item.qty_total < 0) {
    errors.push('Total quantity must be non-negative');
  }

  if (item.qty_issued < 0) {
    errors.push('Issued quantity must be non-negative');
  }

  if (item.qty_issued > item.qty_total) {
    errors.push('Issued quantity cannot exceed total quantity');
  }

  // Validate gender field
  if (item.gender && !['M', 'F'].includes(item.gender)) {
    errors.push('Gender must be "M", "F", or empty');
  }

  // Validate unit of measure field
  if (item.unit_of_measure && !['EA', 'PR'].includes(item.unit_of_measure)) {
    errors.push('Unit of measure must be "EA", "PR", or empty');
  }

  return errors;
}

export const InventoryBulkUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useInventoryCategories();
  const { bulkCreateItems } = useInventoryItems();

  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedInventoryItem[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    try {
      console.log('Starting CSV upload for file:', uploadedFile.name);
      const csvText = await uploadedFile.text();
      const rawData = parseCSV(csvText);
      console.log(`Parsed ${rawData.length} rows from CSV`);
      
      const processed = rawData.map((row, index) => {
        console.log(`Processing row ${index + 1}:`, row);
        // Clean gender value - map invalid values to null
        const rawGender = row['Gender']?.toString().trim();
        let gender: string | null = null;
        if (rawGender && ['M', 'F'].includes(rawGender.toUpperCase())) {
          gender = rawGender.toUpperCase();
        }

        // Clean unit_of_measure value - map invalid values to null
        const rawUnit = row['Unit']?.toString().trim();
        let unitOfMeasure: string | null = null;
        if (rawUnit && ['EA', 'PR'].includes(rawUnit.toUpperCase())) {
          unitOfMeasure = rawUnit.toUpperCase();
        }

        const item: InventoryItemFormData = {
          item_id: row['Item ID']?.toString().trim() || null,
          item: row['Item']?.toString().trim() || `Item ${index + 1}`,
          category: row['Category']?.toString().trim() || null,
          sub_category: row['Sub Category']?.toString().trim() || null,
          size: row['Size']?.toString().trim() || null,
          gender: gender,
          qty_total: Math.max(0, parseInt(row['Total Qty']?.toString()) || 0),
          qty_issued: Math.max(0, parseInt(row['Issued Qty']?.toString()) || 0),
          issued_to: [],
          stock_number: row['Stock Number'] || null,
          unit_of_measure: unitOfMeasure,
          has_serial_number: row['Has Serial Number']?.toLowerCase() === 'true' || false,
          model_number: row['Model Number'] || null,
          returnable: row['Returnable']?.toLowerCase() === 'true' || false,
          accountable: row['Accountable']?.toLowerCase() === 'true' || false,
          pending_updates: parseInt(row['Pending Updates']) || 0,
          pending_issue_changes: parseInt(row['Pending Issue Changes']) || 0,
          pending_write_offs: parseInt(row['Pending Write-offs']) || 0,
          description: row['Description'] || null,
          condition: row['Condition'] || null,
          location: row['Location'] || null,
          notes: row['Notes'] || null,
          status: (['available', 'checked_out', 'maintenance', 'damaged', 'lost'].includes(row['Status'])) 
            ? row['Status'] as 'available' | 'checked_out' | 'maintenance' | 'damaged' | 'lost'
            : 'available',
        };
        console.log(`Processed item ${index + 1}:`, item);
        const errors = validateInventoryData(item);
        if (errors.length > 0) {
          console.error(`Validation errors for row ${index + 1}:`, errors);
        }
        return {
          ...item,
          id: `temp-${index}`,
          errors,
          isValid: errors.length === 0
        };
      });
      
      console.log(`Processing complete: ${processed.filter(p => p.isValid).length} valid, ${processed.filter(p => !p.isValid).length} invalid items`);
      setParsedItems(processed);
      setFile(uploadedFile);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFileUpload(droppedFile);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  }, [handleFileUpload]);

  const updateItem = (id: string, field: keyof InventoryItemFormData, value: string | number | boolean | null) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          [field]: value
        };
        const errors = validateInventoryData(updated);
        return {
          ...updated,
          errors,
          isValid: errors.length === 0
        };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleImport = async () => {
    const validItems = parsedItems.filter(item => item.isValid);
    if (validItems.length === 0) return;
    
    setIsImporting(true);
    setStep('import');
    setProgress(0);
    
    try {
      const validItems = parsedItems.filter(item => item.isValid);
      console.log(`Attempting to import ${validItems.length} valid items out of ${parsedItems.length} total items`);
      
      if (validItems.length === 0) {
        throw new Error('No valid items to import. Please check your data and fix validation errors.');
      }
      
      const cleanItems = validItems.map(item => ({
        item_id: item.item_id,
        item: item.item,
        category: item.category,
        sub_category: item.sub_category,
        size: item.size,
        gender: item.gender,
        qty_total: item.qty_total,
        qty_issued: item.qty_issued,
        issued_to: item.issued_to,
        stock_number: item.stock_number,
        unit_of_measure: item.unit_of_measure,
        has_serial_number: item.has_serial_number,
        model_number: item.model_number,
        returnable: item.returnable,
        accountable: item.accountable,  
        pending_updates: item.pending_updates,
        pending_issue_changes: item.pending_issue_changes,
        pending_write_offs: item.pending_write_offs,
        description: item.description,
        condition: item.condition,
        location: item.location,
        notes: item.notes,
        status: item.status || 'available'
      }));
      
      console.log('Clean items prepared for database:', cleanItems);
      await bulkCreateItems(cleanItems);
      
      console.log('Bulk import successful');
      setImportResults({
        success: validItems.length,
        failed: 0,
        errors: []
      });
    } catch (error) {
      console.error('Bulk import failed with error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setImportResults({
        success: 0,
        failed: validItems.length,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred during import']
      });
    }
    
    setProgress(100);
    setStep('complete');
    setIsImporting(false);
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload');
      setFile(null);
      setParsedItems([]);
    } else if (step === 'complete') {
      navigate('/app/inventory');
    } else {
      navigate('/app/inventory');
    }
  };

  const validCount = parsedItems.filter(c => c.isValid).length;
  const invalidCount = parsedItems.length - validCount;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={handleBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 'complete' ? 'Back to Inventory' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Import Inventory</h1>
            <p className="text-muted-foreground">
              Upload a CSV file to import multiple inventory items
            </p>
          </div>
        </div>
      </div>

      <Card className="w-full">
        <CardContent className="p-6">
          {step === 'upload' && (
            <div className="flex-1 p-6">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors" 
                   onDrop={handleDrop} 
                   onDragOver={e => e.preventDefault()}>
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                  id="csv-upload"
                />
                <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                
                <div className="mt-6 text-sm text-muted-foreground">
                  <h4 className="font-medium mb-2">Required CSV columns:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <span>• Item ID</span>
                    <span>• Item</span>
                    <span>• Category</span>
                    <span>• Total Qty</span>
                    <span>• Issued Qty</span>
                    <span>• Sub Category</span>
                    <span>• Size</span>
                    <span>• Gender</span>
                    <span>• Stock Number</span>
                    <span>• Unit</span>
                    <span>• Location</span>
                    <span>• Notes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {validCount} Valid
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {invalidCount} Invalid
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep('upload')}>
                      Back
                    </Button>
                    <Button onClick={handleImport} disabled={validCount === 0}>
                      Import {validCount} Items
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item ID</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Total Qty</TableHead>
                        <TableHead>Issued Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {parsedItems.map(item => (
                      <TableRow key={item.id} className={!item.isValid ? 'bg-red-50' : ''}>
                        <TableCell>
                          {editingRow === item.id ? (
                            <Input
                              value={item.item_id}
                              onChange={e => updateItem(item.id, 'item_id', e.target.value)}
                              className="h-8"
                            />
                          ) : item.item_id}
                        </TableCell>
                        <TableCell>
                          {editingRow === item.id ? (
                            <Input
                              value={item.item}
                              onChange={e => updateItem(item.id, 'item', e.target.value)}
                              className="h-8"
                            />
                          ) : item.item}
                        </TableCell>
                        <TableCell>
                          {editingRow === item.id ? (
                            <Select value={item.category || ''} onValueChange={value => updateItem(item.id, 'category', value)}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : item.category}
                        </TableCell>
                        <TableCell>
                          {editingRow === item.id ? (
                            <Select value={item.gender || ''} onValueChange={value => updateItem(item.id, 'gender', value || null)}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="F">F</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : item.gender || '-'}
                        </TableCell>
                        <TableCell>
                          {editingRow === item.id ? (
                            <Select value={item.unit_of_measure || ''} onValueChange={value => updateItem(item.id, 'unit_of_measure', value || null)}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                <SelectItem value="EA">EA</SelectItem>
                                <SelectItem value="PR">PR</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : item.unit_of_measure || '-'}
                        </TableCell>
                        <TableCell>
                          {editingRow === item.id ? (
                            <Input
                              type="number"
                              value={item.qty_total}
                              onChange={e => updateItem(item.id, 'qty_total', parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          ) : item.qty_total}
                        </TableCell>
                        <TableCell>
                          {editingRow === item.id ? (
                            <Input
                              type="number"
                              value={item.qty_issued}
                              onChange={e => updateItem(item.id, 'qty_issued', parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          ) : item.qty_issued}
                        </TableCell>
                        <TableCell>
                          {item.isValid ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              Invalid
                            </Badge>
                          )}
                          {item.errors.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {item.errors.join(', ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {editingRow === item.id ? (
                              <Button size="sm" variant="outline" onClick={() => setEditingRow(null)} className="h-8 w-8 p-0">
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setEditingRow(item.id)} className="h-8 w-8 p-0">
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 'import' && (
            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Creating Items...</h3>
                <p className="text-muted-foreground mb-6">
                  Creating item {Math.min(Math.floor(progress / 100 * validCount) + 1, validCount)} of {validCount}
                </p>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
              </div>
            </div>
          )}

          {step === 'complete' && importResults && (
            <div className="flex-1 p-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
                
                <div className="mb-6">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 mr-2">
                    {importResults.success} Successful
                  </Badge>
                  {importResults.failed > 0 && (
                    <Badge variant="destructive">
                      {importResults.failed} Failed
                    </Badge>
                  )}
                </div>

                {importResults.errors.length > 0 && (
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="text-left">
                        <strong>Errors encountered:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {importResults.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={() => navigate('/app/inventory')} className="mt-4">
                  Go to Inventory Management
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};