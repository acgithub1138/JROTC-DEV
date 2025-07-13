
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Mail, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { useEmailQueue } from '@/hooks/email/useEmailQueue';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const { queueItems, isLoading, retryEmail, cancelEmail, isRetrying, isCancelling } = useEmailQueue();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['email-queue'] });
  };

  const handleManualProcess = async () => {
    setIsProcessing(true);
    try {
      console.log('Manually triggering email processing...');
      const { data, error } = await supabase.functions.invoke('manual-process-emails');
      
      if (error) {
        console.error('Error processing emails:', error);
        throw error;
      }
      
      console.log('Manual processing result:', data);
      // Refresh the queue after processing
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
    } catch (error) {
      console.error('Failed to process emails:', error);
    } finally {
      setIsProcessing(false);
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
            <div>
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
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <Button
                  onClick={handleManualProcess}
                  disabled={isProcessing}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isProcessing ? 'Processing...' : 'Process Now'}
                </Button>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No emails in queue</h3>
              <p className="text-muted-foreground">
                Email queue is empty. Manually sent emails will appear here.
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
                        {item.email_templates?.name || 'Manual'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
