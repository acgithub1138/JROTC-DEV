
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, RefreshCw, X, Mail, AlertCircle, Play, Eye, Edit, Trash2 } from 'lucide-react';
import { useEmailQueue } from '@/hooks/email/useEmailQueue';
import { useEmailPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useEmailProcessor } from '@/hooks/email/useEmailProcessor';
import { EmailViewDialog } from '../dialogs/EmailViewDialog';
import { format } from 'date-fns';

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

export const EmailQueueTab: React.FC = () => {
  const { queueItems, isLoading, retryEmail, cancelEmail, deleteEmail, isRetrying, isCancelling } = useEmailQueue();
  const { canViewDetails, canUpdate, canDelete } = useEmailPermissions();
  const { processEmailQueue, isProcessing } = useEmailProcessor();
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const handleViewEmail = (email: any) => {
    setSelectedEmail(email);
    setShowViewDialog(true);
  };

  const handleEditEmail = (email: any) => {
    // For now, just open the view dialog - could be enhanced to edit mode
    setSelectedEmail(email);
    setShowViewDialog(true);
  };

  const handleDeleteEmail = (emailId: string) => {
    if (window.confirm('Are you sure you want to delete this email from the queue?')) {
      deleteEmail(emailId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Email Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading email queue...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = queueItems.filter(item => item.status === 'pending').length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Email Queue
              <Badge variant="secondary" className="ml-2">
                {queueItems.length} items
              </Badge>
              {pendingCount > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            {pendingCount > 0 && (
              <Button
                onClick={() => processEmailQueue()}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Process Queue'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No emails in queue</h3>
              <p className="text-muted-foreground">
                Email queue is empty. Emails will appear here when triggered by rules.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium py-2">
                        {item.recipient_email}
                      </TableCell>
                      <TableCell className="max-w-xs truncate py-2">
                        {item.subject}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        {item.error_message && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span className="truncate max-w-xs">{item.error_message}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-2">
                        {format(new Date(item.scheduled_at), 'MMM dd, yyyy HH:mm')}
                        {item.sent_at && (
                          <div className="text-green-600">
                            Sent: {format(new Date(item.sent_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        {item.email_templates?.name || item.email_rules?.name || 'Manual'}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-2">
                          {canViewDetails && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEmail(item)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {canUpdate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEmail(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEmail(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {item.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryEmail(item.id)}
                              disabled={isRetrying}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          {item.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelEmail(item.id)}
                              disabled={isCancelling}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmail && (
        <EmailViewDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          email={selectedEmail}
        />
      )}
    </>
  );
};
