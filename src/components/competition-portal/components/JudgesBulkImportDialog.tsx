import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Edit2, Trash2, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { parseCSV, validateJudgeData, NewJudge } from '../utils/judgesCsvProcessor';

interface JudgesBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBulkImport: (judges: NewJudge[], onProgress?: (current: number, total: number) => void) => Promise<{ success: number; failed: number; errors: string[] }>;
}

interface ParsedJudge extends NewJudge {
  id: string;
  errors: string[];
  isValid: boolean;
}

type ImportStep = 'upload' | 'preview' | 'import' | 'complete';

export const JudgesBulkImportDialog = ({ open, onOpenChange, onBulkImport }: JudgesBulkImportDialogProps) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedJudges, setParsedJudges] = useState<ParsedJudge[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    try {
      const csvText = await uploadedFile.text();
      const rawData = parseCSV(csvText);
      
      const processed = rawData.map((row, index) => {
        const judge: NewJudge = {
          name: row['Name'] || '',
          email: row['Email'] || '',
          phone: row['Phone'] || '',
          available: row['Available'] ? row['Available'].toLowerCase() === 'true' : true
        };

        const errors = validateJudgeData(judge);
        
        return {
          ...judge,
          id: `temp-${index}`,
          errors,
          isValid: errors.length === 0
        };
      });

      setParsedJudges(processed);
      setFile(uploadedFile);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing CSV:', error);
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

  const updateJudge = (id: string, field: keyof NewJudge, value: string | boolean) => {
    setParsedJudges(prev => prev.map(judge => {
      if (judge.id === id) {
        const updated = { ...judge, [field]: value };
        const errors = validateJudgeData(updated);
        return { ...updated, errors, isValid: errors.length === 0 };
      }
      return judge;
    }));
  };

  const removeJudge = (id: string) => {
    setParsedJudges(prev => prev.filter(judge => judge.id !== id));
  };

  const handleImport = async () => {
    const validJudges = parsedJudges.filter(judge => judge.isValid);
    if (validJudges.length === 0) return;

    setIsImporting(true);
    setStep('import');
    setProgress(0);

    const results = await onBulkImport(validJudges, (current, total) => {
      const progressPercent = Math.round((current / total) * 100);
      setProgress(progressPercent);
    });
    
    setImportResults(results);
    setProgress(100);
    setStep('complete');
    setIsImporting(false);
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setParsedJudges([]);
    setEditingRow(null);
    setProgress(0);
    setImportResults(null);
    setIsImporting(false);
    onOpenChange(false);
  };

  const validCount = parsedJudges.filter(j => j.isValid).length;
  const invalidCount = parsedJudges.length - validCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Import Judges
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex-1 p-6">
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
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
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('csv-upload')?.click()}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">Required CSV columns:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <span>• Name (required)</span>
                  <span>• Email (optional)</span>
                  <span>• Phone (optional)</span>
                  <span>• Available (optional, true/false)</span>
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
                  <Button 
                    onClick={handleImport} 
                    disabled={validCount === 0}
                  >
                    Import {validCount} Judges
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedJudges.map((judge) => (
                    <TableRow key={judge.id} className={!judge.isValid ? 'bg-red-50' : ''}>
                      <TableCell>
                        {editingRow === judge.id ? (
                          <Input 
                            value={judge.name}
                            onChange={(e) => updateJudge(judge.id, 'name', e.target.value)}
                            className="h-8"
                          />
                        ) : judge.name}
                      </TableCell>
                      <TableCell>
                        {editingRow === judge.id ? (
                          <Input 
                            value={judge.email || ''}
                            onChange={(e) => updateJudge(judge.id, 'email', e.target.value)}
                            className="h-8"
                          />
                        ) : judge.email || '-'}
                      </TableCell>
                      <TableCell>
                        {editingRow === judge.id ? (
                          <Input 
                            value={judge.phone || ''}
                            onChange={(e) => updateJudge(judge.id, 'phone', e.target.value)}
                            className="h-8"
                          />
                        ) : judge.phone || '-'}
                      </TableCell>
                      <TableCell>
                        {editingRow === judge.id ? (
                          <Select 
                            value={judge.available.toString()} 
                            onValueChange={(value) => updateJudge(judge.id, 'available', value === 'true')}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Available</SelectItem>
                              <SelectItem value="false">Not Available</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={judge.available ? "secondary" : "outline"}>
                            {judge.available ? 'Available' : 'Not Available'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {judge.isValid ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Invalid
                          </Badge>
                        )}
                        {judge.errors.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {judge.errors.join(', ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingRow === judge.id ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRow(null)}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRow(judge.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeJudge(judge.id)}
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
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Importing Judges...</h3>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Please wait while we import your judges. This may take a few moments.
              </p>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex-1 p-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              
              {importResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-green-100 text-green-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold">{importResults.success}</div>
                      <div className="text-sm">Successful</div>
                    </div>
                    <div className="bg-red-100 text-red-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold">{importResults.failed}</div>
                      <div className="text-sm">Failed</div>
                    </div>
                  </div>
                  
                  {importResults.errors.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Import Errors:</div>
                        <ul className="text-sm space-y-1">
                          {importResults.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              <Button onClick={handleClose} className="mt-4">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};