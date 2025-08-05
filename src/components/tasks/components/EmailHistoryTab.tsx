import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Mail, Clock, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskEmailHistory } from '@/hooks/email/useTaskEmailHistory';
import { EmailContentModal } from './EmailContentModal';

interface EmailHistoryTabProps {
  taskId: string;
}

export const EmailHistoryTab: React.FC<EmailHistoryTabProps> = ({ taskId }) => {
  const { data: emails, isLoading, error } = useTaskEmailHistory(taskId);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

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

  const handleViewEmail = (email: any) => {
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load email history</p>
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No emails sent for this task yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <Card key={email.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(email.status)}
                <Badge className={getStatusColor(email.status)}>
                  {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                </Badge>
                {email.email_templates && (
                  <Badge variant="outline" className="text-xs">
                    {email.email_templates.name}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewEmail(email)}
                className="h-7 px-2"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">To: </span>
                <span className="text-sm text-muted-foreground">{email.recipient_email}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Subject: </span>
                <span className="text-sm">{email.subject}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Scheduled: {format(new Date(email.scheduled_at), 'MMM d, yyyy h:mm a')}
                </div>
                {email.sent_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Sent: {format(new Date(email.sent_at), 'MMM d, yyyy h:mm a')}
                  </div>
                )}
              </div>
              {email.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-800">{email.error_message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <EmailContentModal
        email={selectedEmail}
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
      />
    </div>
  );
};