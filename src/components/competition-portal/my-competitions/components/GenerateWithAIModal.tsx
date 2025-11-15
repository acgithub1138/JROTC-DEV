import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GenerateWithAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldsGenerated: (fields: any) => void;
}

export const GenerateWithAIModal: React.FC<GenerateWithAIModalProps> = ({
  open,
  onOpenChange,
  onFieldsGenerated
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const parsePDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Simple text extraction - in a production app, you'd use a proper PDF parsing library
          const textDecoder = new TextDecoder();
          const text = textDecoder.decode(uint8Array);
          
          // Basic cleanup - remove binary data markers
          const cleanText = text
            .replace(/[^\x20-\x7E\n\r]/g, ' ') // Keep only printable ASCII
            .replace(/\s+/g, ' ')
            .trim();
          
          if (!cleanText || cleanText.length < 50) {
            reject(new Error('Could not extract meaningful text from PDF. Please ensure the PDF contains readable text.'));
            return;
          }
          
          resolve(cleanText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    setIsGenerating(true);

    try {
      // Parse PDF to extract text
      toast.info('Extracting text from PDF...');
      const pdfText = await parsePDF(selectedFile);

      if (pdfText.length > 500000) {
        toast.error('PDF text is too long. Please use a shorter form.');
        setIsGenerating(false);
        return;
      }

      // Send to AI edge function
      toast.info('Generating fields with AI...');
      const { data, error } = await supabase.functions.invoke('generate-fields-from-pdf', {
        body: { pdfText }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data || !data.fields) {
        throw new Error('No fields generated from AI');
      }

      toast.success('Fields generated successfully!');
      onFieldsGenerated(data.fields);
      onOpenChange(false);
      setSelectedFile(null);

    } catch (error: any) {
      console.error('Error generating fields:', error);
      
      if (error.message?.includes('Rate limits exceeded')) {
        toast.error('AI rate limits exceeded. Please try again in a few moments.');
      } else if (error.message?.includes('Payment required')) {
        toast.error('AI credits exhausted. Please add funds to your Lovable AI workspace.');
      } else {
        toast.error(error.message || 'Failed to generate fields from PDF');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Fields from PDF</DialogTitle>
          <DialogDescription>
            Upload a score sheet PDF form and AI will automatically generate the field structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 space-y-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-center">
              {selectedFile ? (
                <span className="font-medium">{selectedFile.name}</span>
              ) : (
                <span className="text-muted-foreground">Select a PDF file</span>
              )}
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
              disabled={isGenerating}
            />
            <label htmlFor="pdf-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isGenerating}
                asChild
              >
                <span className="cursor-pointer">
                  {selectedFile ? 'Change File' : 'Choose File'}
                </span>
              </Button>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedFile(null);
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedFile || isGenerating}
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Fields
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};