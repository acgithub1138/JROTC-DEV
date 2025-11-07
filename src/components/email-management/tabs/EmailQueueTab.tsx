import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, Mail, AlertCircle, RefreshCw, Play, Activity, Users, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEmailQueue } from '@/hooks/email/useEmailQueue';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { EmailViewDialog } from '@/components/email-management/dialogs/EmailViewDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmailQueueCards } from '@/components/email-management/cards/EmailQueueCards';
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
  const isMobile = useIsMobile();
  const {
    queueItems,
    isLoading,
    retryEmail,
    cancelEmail,
    isRetrying,
    isCancelling
  } = useEmailQueue();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const [viewingEmail, setViewingEmail] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 25;
  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['email-queue']
    });
  };
  const handleMonitor = async () => {
    setIsMonitoring(true);
    try {
      console.log('🔍 Running email queue health monitor...');
      const {
        data,
        error
      } = await supabase.functions.invoke('email-monitor');
      if (error) {
        console.error('❌ Monitor error:', error);
        throw error;
      }
      console.log('📊 Monitor report:', data);

      // Refresh queue after monitoring
      queryClient.invalidateQueries({
        queryKey: ['email-queue']
      });
    } catch (error) {
      console.error('💥 Monitor failed:', error);
    } finally {
      setIsMonitoring(false);
    }
  };
  const handleManualProcess = async () => {
    setIsProcessing(true);
    try {
      console.log('🔄 Manually triggering enhanced email processing...');

      // Get pending emails with full details for better feedback
      const {
        data: pendingEmails,
        error: fetchError
      } = await supabase.from('email_queue').select('id, recipient_email, subject, retry_count, error_message').eq('status', 'pending').lte('scheduled_at', new Date().toISOString());
      if (fetchError) {
        console.error('❌ Error fetching pending emails:', fetchError);
        throw fetchError;
      }
      if (!pendingEmails || pendingEmails.length === 0) {
        console.log('ℹ️ No pending emails to process');
        queryClient.invalidateQueries({
          queryKey: ['email-queue']
        });
        return;
      }
      console.log(`📧 Found ${pendingEmails.length} pending emails to process`);

      // Enhanced processing with detailed feedback
      let processed = 0;
      let failed = 0;
      let retryScheduled = 0;
      const errors: Array<{
        emailId: string;
        recipient: string;
        error: any;
      }> = [];
      const details: Array<{
        emailId: string;
        recipient: string;
        status: string;
        [key: string]: any;
      }> = [];
      for (const email of pendingEmails) {
        try {
          console.log(`📤 Processing email ID: ${email.id} (To: ${email.recipient_email}, Retry: ${email.retry_count || 0})`);
          const {
            data,
            error
          } = await supabase.functions.invoke('email-queue-webhook', {
            body: {
              email_id: email.id,
              manual_trigger: true
            }
          });
          if (error) {
            console.error(`❌ Function error for email ${email.id}:`, error);
            errors.push({
              emailId: email.id,
              recipient: email.recipient_email,
              error: error.message || 'Unknown error'
            });
            failed++;
          } else if (data?.success) {
            processed++;
            details.push({
              emailId: email.id,
              recipient: email.recipient_email,
              status: 'sent',
              processingTime: data.processingTime,
              emailDetails: data.emailDetails
            });
          } else {
            // Handle retry scenarios or other non-success responses
            const isRetryScheduled = data?.emailDetails?.retryScheduled;
            if (isRetryScheduled) {
              console.log(`🔄 Email ${email.id} scheduled for retry:`, data);
              retryScheduled++;
              details.push({
                emailId: email.id,
                recipient: email.recipient_email,
                status: 'retry_scheduled',
                nextRetryAt: data.emailDetails?.nextRetryAt,
                retryCount: data.emailDetails?.retryCount
              });
            } else {
              console.warn(`⚠️ Email ${email.id} processing returned non-success:`, data);
              errors.push({
                emailId: email.id,
                recipient: email.recipient_email,
                error: data?.error || 'Processing failed'
              });
              failed++;
            }
          }
        } catch (networkError) {
          console.error(`🌐 Network error for email ${email.id}:`, networkError);
          console.error('Network error details:', {
            name: (networkError as Error).name,
            message: (networkError as Error).message,
            stack: (networkError as Error).stack
          });
          errors.push({
            emailId: email.id,
            recipient: email.recipient_email,
            error: `Network error: ${(networkError as Error).message}`
          });
          failed++;
        }

        // Small delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Enhanced results logging
      console.group('📊 Enhanced Processing Results:');
      console.log(`📧 Total emails processed: ${pendingEmails.length}`);
      console.log(`✅ Successfully sent: ${processed}`);
      console.log(`🔄 Retries scheduled: ${retryScheduled}`);
      console.log(`❌ Failed: ${failed}`);
      if (details.length > 0) {
        console.log('📋 Success details:', details);
      }
      if (errors.length > 0) {
        console.log('❌ Error details:');
        errors.forEach(({
          emailId,
          recipient,
          error
        }) => {
          console.error(`  - ${emailId} (${recipient}):`, error);
        });
      }
      console.groupEnd();

      // Refresh the queue after processing
      queryClient.invalidateQueries({
        queryKey: ['email-queue']
      });

      // Enhanced user feedback
      let resultMessage = '';
      if (processed > 0) {
        resultMessage += `✅ ${processed} emails sent`;
      }
      if (retryScheduled > 0) {
        resultMessage += `${resultMessage ? ', ' : ''}🔄 ${retryScheduled} retries scheduled`;
      }
      if (failed > 0) {
        resultMessage += `${resultMessage ? ', ' : ''}❌ ${failed} failed`;
      }
      console.log(`📋 Final result: ${resultMessage || 'No emails processed'}`);
    } catch (error) {
      console.error('💥 Critical error in manual processing:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
    } finally {
      setIsProcessing(false);
    }
  };
  if (isLoading) {
    return <Card>
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
      </Card>;
  }
  const pendingCount = queueItems.filter(item => item.status === 'pending').length;

  // Pagination calculations
  const totalItems = queueItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = queueItems.slice(startIndex, endIndex);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };
  return <>
      <Card>
        
        <CardContent>
          {queueItems.length === 0 ? <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No emails in queue</h3>
              <p className="text-muted-foreground">
                Email queue is empty. Manually sent emails will appear here.
              </p>
            </div> : (
              <>
                {isMobile ? (
                  <EmailQueueCards 
                    items={paginatedItems} 
                    onViewEmail={(item) => setViewingEmail(item)} 
                  />
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
                   {paginatedItems.map(item => {
                const recipients = item.recipient_email.split(',').map(email => email.trim());
                const hasMultiple = recipients.length > 1;
                return <TableRow key={item.id}>
                         <TableCell className="font-medium py-[4px]">
                           {hasMultiple ? <div className="flex items-center gap-2">
                               <Popover>
                                 <PopoverTrigger asChild>
                                   <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                                     <Users className="w-3 h-3 mr-1" />
                                     Multiple ({recipients.length})
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-80">
                                   <div className="space-y-2">
                                     <h4 className="font-medium text-sm">Recipients ({recipients.length})</h4>
                                     <div className="max-h-48 overflow-y-auto space-y-1">
                                       {recipients.map((email, index) => <div key={index} className="text-xs p-2 bg-muted rounded border">
                                           {email}
                                         </div>)}
                                     </div>
                                   </div>
                                 </PopoverContent>
                               </Popover>
                             </div> : item.recipient_email}
                         </TableCell>
                       <TableCell className="max-w-xs truncate py-[4px]">
                         {item.subject}
                       </TableCell>
                       <TableCell className="py-[4px]">
                         <Badge className={getStatusColor(item.status)}>
                           {item.status}
                         </Badge>
                         {item.error_message && <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                             <AlertCircle className="w-3 h-3" />
                             <span className="truncate max-w-xs">{item.error_message}</span>
                           </div>}
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground py-[4px]">
                         {format(new Date(item.scheduled_at), 'MMM dd, yyyy HH:mm')}
                         {item.sent_at && <div className="text-green-600">
                             Sent: {format(new Date(item.sent_at), 'MMM dd, yyyy HH:mm')}
                           </div>}
                       </TableCell>
                       <TableCell className="text-sm py-[4px]">
                         {item.email_templates?.name || 'Manual'}
                       </TableCell>
                       <TableCell className="py-[4px]">
                         <Button variant="ghost" size="sm" onClick={() => setViewingEmail(item)} className="h-8 w-8 p-0">
                           <Eye className="w-4 h-4" />
                         </Button>
                       </TableCell>
                     </TableRow>;
              })}
                  </TableBody>
                </Table>
              </div>
                )}
                
                {/* Pagination Controls */}
                {totalPages > 1 && <div className="flex items-center justify-between px-2 py-4">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} emails
                   </div>
                   <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentPage === 1} className="h-8 w-8 p-0">
                       <ChevronLeft className="w-4 h-4" />
                     </Button>
                     <div className="flex items-center gap-1">
                       {Array.from({
                  length: Math.min(5, totalPages)
                }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className="h-8 w-8 p-0">
                             {pageNum}
                           </Button>;
                })}
                     </div>
                     <Button variant="outline" size="sm" onClick={handleNext} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                       <ChevronRight className="w-4 h-4" />
                     </Button>
                    </div>
                  </div>}
              </>
            )}
        </CardContent>
      </Card>
      
      {viewingEmail && <EmailViewDialog open={!!viewingEmail} onOpenChange={open => !open && setViewingEmail(null)} email={viewingEmail} />}
    </>;
};