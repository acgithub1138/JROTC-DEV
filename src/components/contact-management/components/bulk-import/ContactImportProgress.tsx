import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ContactImportProgressProps {
  progress: number;
}

export const ContactImportProgress: React.FC<ContactImportProgressProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <h3 className="text-lg font-semibold mb-2">Importing Contacts...</h3>
      <p className="text-muted-foreground mb-6">Please wait while we process your contacts</p>
      <Progress value={progress} className="w-full max-w-md" />
      <p className="text-sm text-muted-foreground mt-2">{progress}% Complete</p>
    </div>
  );
};
