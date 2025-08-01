import React from 'react';
import DOMPurify from 'dompurify';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { EmailQueueItem } from '@/hooks/email/useEmailQueue';
import { format } from 'date-fns';
interface EmailViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: EmailQueueItem;
}
export const EmailViewDialog: React.FC<EmailViewDialogProps> = ({
  open,
  onOpenChange,
  email
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Recipient:</div>
                  <div className="text-sm">{email.recipient_email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Status:</div>
                  <Badge className={getStatusColor(email.status)}>
                    {email.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Scheduled:</div>
                  <div className="text-sm">
                    {format(new Date(email.scheduled_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
                {email.sent_at && <div>
                    <div className="text-sm font-medium text-gray-700">Sent:</div>
                    <div className="text-sm text-green-600">
                      {format(new Date(email.sent_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>}
                {email.email_templates?.name && <div>
                    <div className="text-sm font-medium text-gray-700">Template:</div>
                    <div className="text-sm">{email.email_templates.name}</div>
                  </div>}
              </div>
              
              {email.error_message && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-sm font-medium text-red-800">Error Message:</div>
                  <div className="text-sm text-red-700 mt-1">{email.error_message}</div>
                </div>}
            </CardContent>
          </Card>

          {/* Email content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Subject:</div>
                <div className="p-3 bg-gray-50 rounded border text-sm">
                  {email.subject || '(No subject)'}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Body:</div>
                <div className="p-3 bg-gray-50 rounded border text-sm min-h-[200px]">
                  {email.body ? <div dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(email.body, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
                    ALLOWED_ATTR: ['href', 'target'],
                    ALLOW_DATA_ATTR: false
                  })
                }} className="prose prose-sm max-w-none" /> : '(No body content)'}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};