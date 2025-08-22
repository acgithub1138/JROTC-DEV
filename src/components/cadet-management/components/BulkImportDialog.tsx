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
import { useAuth } from '@/contexts/AuthContext';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';
import { parseCSV, validateCadetData } from '../utils/csvProcessor';
import { NewCadet } from '../types';
import { gradeOptions, flightOptions } from '../constants';
import { getGradeColor } from '@/utils/gradeColors';
import { useCadetRoles } from '@/hooks/useCadetRoles';
interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBulkImport: (cadets: NewCadet[], onProgress?: (current: number, total: number) => void) => Promise<{
    success: number;
    failed: number;
    errors: string[];
  }>;
}
interface ParsedCadet extends NewCadet {
  id: string;
  errors: string[];
  isValid: boolean;
}
type ImportStep = 'upload' | 'preview' | 'import' | 'complete';
export const BulkImportDialog = ({
  open,
  onOpenChange,
  onBulkImport
}: BulkImportDialogProps) => {
  const {
    userProfile
  } = useAuth();
  const ranks = getRanksForProgram(userProfile?.schools?.jrotc_program as JROTCProgram);
  const {
    roleOptions
  } = useCadetRoles();
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedCadets, setParsedCadets] = useState<ParsedCadet[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  // Helper function to convert numeric cadet year to ordinal format
  const convertCadetYear = (year: string): string => {
    if (!year) return '';
    const numericYear = year.trim();
    switch (numericYear) {
      case '1': return '1st';
      case '2': return '2nd';
      case '3': return '3rd';
      case '4': return '4th';
      default: return year; // Return as-is if already in correct format or invalid
    }
  };

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    try {
      const csvText = await uploadedFile.text();
      const rawData = parseCSV(csvText);
      const processed = rawData.map((row, index) => {
        const rawCadetYear = row['Cadet Year'] || row['Year'] || '';
        const cadet: NewCadet = {
          first_name: row['First Name'] || '',
          last_name: row['Last Name'] || '',
          email: row['Email'] || '',
          role_id: row['Role ID'] || row['Role']?.toLowerCase() || '',
          grade: row['Grade'] || '',
          rank: row['Rank'] || '',
          flight: row['Flight'] || '',
          cadet_year: convertCadetYear(rawCadetYear)
        };
        const errors = validateCadetData(cadet);
        return {
          ...cadet,
          id: `temp-${index}`,
          errors,
          isValid: errors.length === 0
        };
      });
      setParsedCadets(processed);
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
  const updateCadet = (id: string, field: keyof NewCadet, value: string) => {
    setParsedCadets(prev => prev.map(cadet => {
      if (cadet.id === id) {
        const updated = {
          ...cadet,
          [field]: value
        };
        const errors = validateCadetData(updated);
        return {
          ...updated,
          errors,
          isValid: errors.length === 0
        };
      }
      return cadet;
    }));
  };
  const removeCadet = (id: string) => {
    setParsedCadets(prev => prev.filter(cadet => cadet.id !== id));
  };
  const handleImport = async () => {
    const validCadets = parsedCadets.filter(cadet => cadet.isValid);
    if (validCadets.length === 0) return;
    setIsImporting(true);
    setStep('import');
    setProgress(0);
    const results = await onBulkImport(validCadets, (current, total) => {
      const progressPercent = Math.round(current / total * 100);
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
    setParsedCadets([]);
    setEditingRow(null);
    setProgress(0);
    setImportResults(null);
    setIsImporting(false);
    onOpenChange(false);
  };
  const validCount = parsedCadets.filter(c => c.isValid).length;
  const invalidCount = parsedCadets.length - validCount;
  return <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Import Cadets
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && <div className="flex-1 p-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" id="csv-upload" />
              <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">Required CSV columns:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <span>• First Name</span>
                  <span>• Last Name</span>
                  <span>• Email</span>
                  <span>• Role</span>
                  <span>• Grade</span>
                  <span>• Flight</span>
                  <span>• Rank</span>
                  <span>• Cadet Year (or Year)</span>
                </div>
              </div>
            </div>
          </div>}

        {step === 'preview' && <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {invalidCount} Invalid
                    </Badge>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                  </Button>
                  <Button onClick={handleImport} disabled={validCount === 0}>
                    Import {validCount} Cadets
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Flight</TableHead>
                    <TableHead>Cadet Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedCadets.map(cadet => <TableRow key={cadet.id} className={!cadet.isValid ? 'bg-red-50' : ''}>
                      <TableCell>
                        {editingRow === cadet.id ? <Input value={cadet.first_name} onChange={e => updateCadet(cadet.id, 'first_name', e.target.value)} className="h-8" /> : cadet.first_name}
                      </TableCell>
                      <TableCell>
                        {editingRow === cadet.id ? <Input value={cadet.last_name} onChange={e => updateCadet(cadet.id, 'last_name', e.target.value)} className="h-8" /> : cadet.last_name}
                      </TableCell>
                      <TableCell>
                        {editingRow === cadet.id ? <Input value={cadet.email} onChange={e => updateCadet(cadet.id, 'email', e.target.value)} className="h-8" /> : cadet.email}
                      </TableCell>
                      <TableCell>
                        {editingRow === cadet.id ? <Select value={cadet.role_id} onValueChange={value => updateCadet(cadet.id, 'role_id', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map(role => <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>)}
                            </SelectContent>
                          </Select> : roleOptions.find(r => r.value === cadet.role_id)?.label || cadet.role_id}
                      </TableCell>
                      <TableCell>
                        {editingRow === cadet.id ? <Select value={cadet.grade || ''} onValueChange={value => updateCadet(cadet.id, 'grade', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeOptions.map(grade => <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>)}
                            </SelectContent>
                          </Select> : cadet.grade ? <Badge className={`text-xs ${getGradeColor(cadet.grade)}`}>
                            {cadet.grade}
                          </Badge> : '-'}
                      </TableCell>
                      <TableCell>
                        {editingRow === cadet.id ? <Select value={cadet.rank || ''} onValueChange={value => updateCadet(cadet.id, 'rank', value === "none" ? "" : value)} disabled={ranks.length === 0}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={ranks.length === 0 ? userProfile?.schools?.jrotc_program ? "No ranks available" : "Set JROTC program first" : "Select rank"} />
                            </SelectTrigger>
                            <SelectContent>
                              {ranks.length === 0 ? <SelectItem value="none" disabled>
                                  {userProfile?.schools?.jrotc_program ? "No ranks available for this program" : "JROTC program not set for school"}
                                </SelectItem> : ranks.map(rank => <SelectItem key={rank.id} value={rank.rank || "none"}>
                                    {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                                  </SelectItem>)}
                            </SelectContent>
                          </Select> : cadet.rank}
                      </TableCell>
                      <TableCell>
                        {editingRow === cadet.id ? <Select value={cadet.flight || ''} onValueChange={value => updateCadet(cadet.id, 'flight', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select flight" />
                            </SelectTrigger>
                            <SelectContent>
                              {flightOptions.map(flight => <SelectItem key={flight} value={flight}>
                                  {flight}
                                </SelectItem>)}
                            </SelectContent>
                           </Select> : cadet.flight}
                      </TableCell>
                      <TableCell>
                        {editingRow === cadet.id ? 
                          <Select value={cadet.cadet_year || ''} onValueChange={value => updateCadet(cadet.id, 'cadet_year', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st">1st</SelectItem>
                              <SelectItem value="2nd">2nd</SelectItem>
                              <SelectItem value="3rd">3rd</SelectItem>
                              <SelectItem value="4th">4th</SelectItem>
                            </SelectContent>
                          </Select> : 
                          cadet.cadet_year ? <Badge variant="outline" className="text-xs">{cadet.cadet_year}</Badge> : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {cadet.isValid ? <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Valid
                          </Badge> : <Badge variant="destructive">
                            Invalid
                          </Badge>}
                        {cadet.errors.length > 0 && <div className="text-xs text-red-600 mt-1">
                            {cadet.errors.join(', ')}
                          </div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingRow === cadet.id ? <Button size="sm" variant="outline" onClick={() => setEditingRow(null)} className="h-8 w-8 p-0">
                              <CheckCircle className="w-3 h-3" />
                            </Button> : <Button size="sm" variant="outline" onClick={() => setEditingRow(cadet.id)} className="h-8 w-8 p-0">
                              <Edit2 className="w-3 h-3" />
                            </Button>}
                          <Button size="sm" variant="outline" onClick={() => removeCadet(cadet.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </div>}

        {step === 'import' && <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Creating Cadets...</h3>
               <p className="text-muted-foreground mb-6">
                 Creating user {Math.min(Math.floor(progress / 100 * validCount) + 1, validCount)} of {validCount}
               </p>
              <Progress value={progress} className="w-full max-w-md mx-auto" />
            </div>
          </div>}

        {step === 'complete' && importResults && <div className="flex-1 p-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
              
              <div className="mb-6">
                <Badge variant="secondary" className="bg-green-100 text-green-800 mr-2">
                  {importResults.success} Successful
                </Badge>
                {importResults.failed > 0 && <Badge variant="destructive">
                    {importResults.failed} Failed
                  </Badge>}
              </div>

              {importResults.errors.length > 0 && <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-left">
                      <strong>Errors encountered:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {importResults.errors.map((error, index) => <li key={index} className="text-sm">{error}</li>)}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>}

              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>}
      </DialogContent>
    </Dialog>;
};