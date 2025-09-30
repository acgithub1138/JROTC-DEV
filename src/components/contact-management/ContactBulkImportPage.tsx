import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { parseCSV, validateContactData, processCSVContact, ParsedContact, validateCSVHeaders } from './utils/contactCsvProcessor';
import { ContactDataPreviewTable } from './components/bulk-import/ContactDataPreviewTable';
import { ContactImportProgress } from './components/bulk-import/ContactImportProgress';
import { ContactImportResults } from './components/bulk-import/ContactImportResults';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type ImportStep = 'upload' | 'preview' | 'import' | 'complete';

interface ImportResults {
  success: number;
  failed: number;
  errors: string[];
  parentAccountsCreated: number;
}

export const ContactBulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    try {
      const csvText = await uploadedFile.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "The CSV file appears to be empty or invalid",
          variant: "destructive"
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      const headerErrors = validateCSVHeaders(headers);
      
      if (headerErrors.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: headerErrors.join(', '),
          variant: "destructive"
        });
        return;
      }

      const rawData = parseCSV(csvText);
      
      const processed = rawData.map((row, index) => {
        const contact = processCSVContact(row);
        const errors = validateContactData(contact);
        return {
          ...contact,
          id: `temp-${index}`,
          errors,
          isValid: errors.length === 0,
          status: 'active' as const,
        };
      });

      setParsedContacts(processed);
      setFile(uploadedFile);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive"
      });
    }
  }, [toast]);

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

  const updateContact = (id: string, updates: Partial<ParsedContact>) => {
    setParsedContacts(prev => prev.map(contact => {
      if (contact.id === id) {
        const updated = { ...contact, ...updates };
        const errors = validateContactData(updated);
        return {
          ...updated,
          errors,
          isValid: errors.length === 0
        };
      }
      return contact;
    }));
  };

  const removeContact = (id: string) => {
    setParsedContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const handleImport = async () => {
    const validContacts = parsedContacts.filter(contact => contact.isValid);
    if (validContacts.length === 0) return;
    
    setIsImporting(true);
    setStep('import');
    setProgress(0);
    
    try {
      // Call edge function to handle bulk import
      const { data, error } = await supabase.functions.invoke('bulk-import-contacts', {
        body: { contacts: validContacts }
      });

      if (error) throw error;

      setImportResults(data);
      setProgress(100);
      setStep('complete');
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import contacts",
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload');
      setFile(null);
      setParsedContacts([]);
    } else {
      navigate('/app/contacts');
    }
  };

  const validCount = parsedContacts.filter(c => c.isValid).length;
  const invalidCount = parsedContacts.length - validCount;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={handleBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 'complete' ? 'Back to Contacts' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Import Contacts</h1>
            <p className="text-muted-foreground">
              Upload a CSV file to import multiple contacts
            </p>
          </div>
        </div>
      </div>

      <Card className="w-full">
        <CardContent className="p-6">
          {step === 'upload' && (
            <div className="flex-1 p-6">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors" 
                onDrop={handleDrop} 
                onDragOver={e => e.preventDefault()}
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
                    <span>• Email (required)</span>
                    <span>• Type (required)</span>
                    <span>• Phone (optional)</span>
                    <span>• Cadet (optional)</span>
                  </div>
                  <div className="mt-3 p-3 bg-muted/50 rounded">
                    <p className="text-xs">
                      <strong>Type</strong> must be one of: parent, relative, friend, or other<br />
                      <strong>Phone</strong> must be 10 digits<br />
                      <strong>Cadet</strong> names will be matched with active cadets
                    </p>
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
                    <Button onClick={handleImport} disabled={validCount === 0 || isImporting}>
                      Import {validCount} Contacts
                    </Button>
                  </div>
                </div>
              </div>

              <ContactDataPreviewTable
                contacts={parsedContacts}
                onUpdate={updateContact}
                onRemove={removeContact}
              />
            </div>
          )}

          {step === 'import' && (
            <ContactImportProgress progress={progress} />
          )}

          {step === 'complete' && importResults && (
            <ContactImportResults 
              results={importResults}
              onClose={() => navigate('/app/contacts')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactBulkImportPage;
