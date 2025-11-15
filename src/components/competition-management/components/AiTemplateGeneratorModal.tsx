import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Upload, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AiTemplateGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateGenerated: (template: Record<string, any>) => void;
}

export const AiTemplateGeneratorModal: React.FC<AiTemplateGeneratorModalProps> = ({
  open,
  onOpenChange,
  onTemplateGenerated
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfText, setPdfText] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      toast.error('File size must be under 10MB');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setGeneratedTemplate(null);
    setShowPreview(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    // For now, we'll use a simple text extraction
    // In production, you might want to use a more robust PDF parsing library
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    
    try {
      // Try to extract text directly (works for some PDFs)
      const text = decoder.decode(uint8Array);
      
      // Basic extraction - look for readable text between stream objects
      const textMatches = text.match(/\(([^)]+)\)/g);
      if (textMatches && textMatches.length > 0) {
        return textMatches.map(m => m.slice(1, -1)).join(' ');
      }
      
      // If no text found, return the raw content for AI to parse
      return text;
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      // Return the raw content for AI to try to parse
      return decoder.decode(uint8Array);
    }
  };

  const generateTemplate = async () => {
    if (!uploadedFile) {
      setError('Please upload a PDF file first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Extract text from PDF
      const text = await extractTextFromPdf(uploadedFile);
      setPdfText(text);

      console.log('Extracted PDF text length:', text.length);

      // Call edge function
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-template-from-pdf',
        {
          body: { pdfText: text }
        }
      );

      if (functionError) {
        console.error('Function error:', functionError);
        throw functionError;
      }

      if (data.success) {
        setGeneratedTemplate(data.template);
        setShowPreview(true);
        toast.success(`Template generated with ${data.template.criteria?.length || 0} fields!`);
      } else {
        setError(data.error || 'Failed to generate template');
        toast.error(data.error || 'Failed to generate template');
      }
    } catch (err) {
      console.error('Error generating template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate template. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseTemplate = () => {
    if (generatedTemplate) {
      onTemplateGenerated(generatedTemplate);
      handleClose();
    }
  };

  const handleClose = () => {
    setUploadedFile(null);
    setGeneratedTemplate(null);
    setError(null);
    setShowPreview(false);
    setPdfText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Template with AI
          </DialogTitle>
          <DialogDescription>
            Upload a PDF score sheet and let AI generate the template structure for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showPreview && (
            <>
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('pdf-upload')?.click()}
              >
                {uploadedFile ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 text-primary mx-auto" />
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="font-medium">Drop your PDF here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      Maximum file size: 10MB
                    </p>
                  </div>
                )}
              </div>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileInput}
              />

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {uploadedFile && !isGenerating && (
                <Button
                  onClick={generateTemplate}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Template with AI
                </Button>
              )}

              {isGenerating && (
                <div className="flex items-center justify-center gap-3 p-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-muted-foreground">AI is analyzing your score sheet...</p>
                </div>
              )}
            </>
          )}

          {showPreview && generatedTemplate && (
            <>
              {/* Success Message */}
              <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-md">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-sm font-medium">
                  Template generated successfully! Found {generatedTemplate.criteria?.length || 0} fields
                </p>
              </div>

              {/* Template Summary */}
              <div className="space-y-2">
                <h4 className="font-medium">Template Structure:</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Total Fields</p>
                    <p className="text-lg font-semibold">{generatedTemplate.criteria?.length || 0}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Sections</p>
                    <p className="text-lg font-semibold">
                      {generatedTemplate.criteria?.filter((f: any) => f.type === 'section_header').length || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Penalties</p>
                    <p className="text-lg font-semibold">
                      {generatedTemplate.criteria?.filter((f: any) => f.type === 'penalty').length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* JSON Preview */}
              <div className="space-y-2">
                <h4 className="font-medium">Generated JSON:</h4>
                <Textarea
                  value={JSON.stringify(generatedTemplate, null, 2)}
                  readOnly
                  rows={15}
                  className="font-mono text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleUseTemplate} className="flex-1" size="lg">
                  Use This Template
                </Button>
                <Button onClick={() => setShowPreview(false)} variant="outline" className="flex-1">
                  Try Different PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
