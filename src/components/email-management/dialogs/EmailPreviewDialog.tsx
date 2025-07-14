
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecordSelector } from './components/RecordSelector';
import { PreviewContent } from './components/PreviewContent';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  sourceTable: string;
  templateId?: string;
}

export const EmailPreviewDialog: React.FC<EmailPreviewDialogProps> = ({
  open,
  onOpenChange,
  subject,
  body,
  sourceTable,
  templateId,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecordData, setSelectedRecordData] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const handleRecordSelect = (recordId: string, recordData: any) => {
    setSelectedRecordId(recordId);
    setSelectedRecordData(recordData);
  };

  const handleSendEmail = async () => {
    if (!templateId || !selectedRecordId || !recipientEmail || !userProfile?.school_id) {
      toast({
        title: "Missing Information",
        description: "Please select a record and enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('queue-email', {
        body: {
          templateId,
          recipientEmail,
          sourceTable,
          recordId: selectedRecordId,
          schoolId: userProfile.school_id,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Queued",
        description: "Email has been successfully queued for sending.",
      });

      handleClose();
    } catch (error: any) {
      console.error('Error queuing email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to queue email.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSelectedRecordId(null);
    setSelectedRecordData(null);
    setRecipientEmail('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Email Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {sourceTable && (
            <RecordSelector
              tableName={sourceTable}
              selectedRecordId={selectedRecordId}
              onRecordSelect={handleRecordSelect}
            />
          )}

          <PreviewContent
            subject={subject}
            body={body}
            recordData={selectedRecordData}
          />

          {templateId && selectedRecordId && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Send Email</h3>
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter recipient email address"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            {templateId && selectedRecordId && recipientEmail && (
              <Button 
                onClick={handleSendEmail} 
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send Email'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
