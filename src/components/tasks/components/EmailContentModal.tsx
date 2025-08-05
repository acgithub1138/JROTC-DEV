import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

interface EmailContentModalProps {
  email: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmailContentModal: React.FC<EmailContentModalProps> = ({
  email,
  open,
  onOpenChange,
}) => {
  if (!email) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <Ban className="w-4 h-4" />;
      case 'rate_limited':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rate_limited':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Sanitize HTML content for safe rendering
  const sanitizedBody = DOMPurify.sanitize(email.body);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Email Metadata */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(email.status)}
              <Badge className={getStatusColor(email.status)}>
                {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
              </Badge>
              {email.email_templates && (
                <Badge variant="outline">
                  Template: {email.email_templates.name}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Recipient:</span>
                <p className="mt-1">{email.recipient_email}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Scheduled:</span>
                <p className="mt-1">{format(new Date(email.scheduled_at), 'PPP p')}</p>
              </div>
              {email.sent_at && (
                <div>
                  <span className="font-medium text-muted-foreground">Sent:</span>
                  <p className="mt-1">{format(new Date(email.sent_at), 'PPP p')}</p>
                </div>
              )}
            </div>

            {email.error_message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="font-medium text-red-800">Error:</span>
                <p className="mt-1 text-sm text-red-700">{email.error_message}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Email Subject */}
          <div>
            <span className="font-medium text-muted-foreground">Subject:</span>
            <p className="mt-1 text-lg font-medium">{email.subject}</p>
          </div>

          <Separator />

          {/* Email Body */}
          <div>
            <span className="font-medium text-muted-foreground">Message:</span>
            <div className="mt-2 min-h-[200px] max-h-[400px] overflow-y-auto">
              {email.body.includes('<') ? (
                // Render HTML content
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                />
              ) : (
                // Render plain text content
                <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md">
                  {email.body}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};