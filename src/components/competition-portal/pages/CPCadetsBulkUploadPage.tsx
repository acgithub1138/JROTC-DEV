import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCPCadets } from '@/hooks/competition-portal/useCPCadets';
import { useCPCadetsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { parseCSV, generateSampleCSV, CPCadetCsvRow } from '../utils/cpCadetsCsvProcessor';
import { useDropzone } from 'react-dropzone';

export function CPCadetsBulkUploadPage() {
  const navigate = useNavigate();
  const { bulkImportCadets } = useCPCadets();
  const { canCreate } = useCPCadetsPermissions();

  const [parsedCadets, setParsedCadets] = useState<CPCadetCsvRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setParsedCadets(parsed);
        setImportResults(null);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleDownloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cadets_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveRow = (index: number) => {
    setParsedCadets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    const validCadets = parsedCadets.filter((c) => c.isValid);
    if (validCadets.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    const results = await bulkImportCadets(
      validCadets.map(({ isValid, errors, ...data }) => data),
      (current, total) => setImportProgress((current / total) * 100)
    );

    setImportResults(results);
    setIsImporting(false);

    if (results.success > 0 && results.failed === 0) {
      setTimeout(() => navigate('/app/competition-portal/cadets'), 1500);
    }
  };

  const validCount = parsedCadets.filter((c) => c.isValid).length;
  const invalidCount = parsedCadets.filter((c) => !c.isValid).length;

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to import cadets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/competition-portal/cadets')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Bulk Import Cadets</h1>
      </div>

      {!parsedCadets.length && !importResults && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file here'}
            </p>
            <p className="text-muted-foreground mt-1">or click to browse</p>
          </div>

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleDownloadSample}>
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              CSV should include columns: first_name, last_name, email, grade
            </AlertDescription>
          </Alert>
        </div>
      )}

      {parsedCadets.length > 0 && !importResults && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Badge variant="outline" className="text-green-600">
                {validCount} Valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="outline" className="text-red-600">
                  {invalidCount} Invalid
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setParsedCadets([])}>
                Clear
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0 || isImporting}>
                {isImporting ? 'Importing...' : `Import ${validCount} Cadets`}
              </Button>
            </div>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Importing... {Math.round(importProgress)}%
              </p>
            </div>
          )}

          <div className="border rounded-lg max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedCadets.map((cadet, index) => (
                  <TableRow key={index} className={!cadet.isValid ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                    <TableCell>
                      {cadet.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-red-600">{cadet.errors.join(', ')}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{cadet.first_name}</TableCell>
                    <TableCell>{cadet.last_name}</TableCell>
                    <TableCell>{cadet.email}</TableCell>
                    <TableCell>{cadet.grade}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {importResults && (
        <div className="space-y-4">
          <Alert className={importResults.failed === 0 ? 'border-green-500' : 'border-yellow-500'}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Import complete: {importResults.success} successful, {importResults.failed} failed
            </AlertDescription>
          </Alert>

          {importResults.errors.length > 0 && (
            <div className="border rounded-lg p-4 max-h-[200px] overflow-auto">
              <p className="font-medium mb-2">Errors:</p>
              <ul className="text-sm text-red-600 space-y-1">
                {importResults.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setParsedCadets([]); setImportResults(null); }}>
              Import More
            </Button>
            <Button onClick={() => navigate('/app/competition-portal/cadets')}>
              Back to Cadets
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
