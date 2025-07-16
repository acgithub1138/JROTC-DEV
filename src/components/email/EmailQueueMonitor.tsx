import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEmailQueue } from '@/hooks/email/useEmailQueue';
import { useEmailQueueHealth } from '@/hooks/email/useEmailQueueHealth';
import { RefreshCw, Play, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const EmailQueueMonitor: React.FC = () => {
  const { queueItems, isLoading: isLoadingQueue } = useEmailQueue();
  const {
    healthHistory,
    isLoadingHealth,
    checkQueueHealth,
    retryStuckEmails,
    processBatch,
    isCheckingHealth,
    isRetrying,
    isProcessingBatch,
  } = useEmailQueueHealth();

  const pendingEmails = queueItems.filter(item => item.status === 'pending');
  const failedEmails = queueItems.filter(item => item.status === 'failed');
  const sentEmails = queueItems.filter(item => item.status === 'sent');

  const latestHealth = healthHistory[0];
  const stuckEmails = pendingEmails.filter(item => {
    const createdAt = new Date(item.created_at);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return createdAt < tenMinutesAgo;
  });

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Email Queue Health
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkQueueHealth()}
              disabled={isCheckingHealth}
            >
              <RefreshCw className={`h-4 w-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              Check Health
            </Button>
          </CardTitle>
          <CardDescription>
            Monitor email queue performance and health status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestHealth && (
            <div className={`p-4 rounded-lg border ${getHealthStatusColor(latestHealth.health_status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {latestHealth.health_status === 'healthy' && <CheckCircle className="h-5 w-5" />}
                  {latestHealth.health_status === 'warning' && <AlertTriangle className="h-5 w-5" />}
                  {latestHealth.health_status === 'critical' && <XCircle className="h-5 w-5" />}
                  <span className="font-medium capitalize">{latestHealth.health_status}</span>
                </div>
                <span className="text-sm">
                  Last check: {formatDistanceToNow(new Date(latestHealth.check_timestamp), { addSuffix: true })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-2xl font-bold">{latestHealth.pending_count}</div>
                  <div className="text-sm opacity-70">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{latestHealth.stuck_count}</div>
                  <div className="text-sm opacity-70">Stuck</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{latestHealth.failed_count}</div>
                  <div className="text-sm opacity-70">Failed (1h)</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Emails</p>
                <p className="text-2xl font-bold">{queueItems.length}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingEmails.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold text-green-600">{sentEmails.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedEmails.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for Issues */}
      {stuckEmails.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stuckEmails.length} email(s) have been pending for more than 10 minutes and may be stuck.
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Management</CardTitle>
          <CardDescription>
            Administrative controls for email queue processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => retryStuckEmails(10)}
              disabled={isRetrying}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              Retry Stuck Emails
            </Button>

            <Button
              variant="outline"
              onClick={() => processBatch(10)}
              disabled={isProcessingBatch}
            >
              <Play className={`h-4 w-4 mr-2 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              Process Batch (10)
            </Button>

            <Button
              variant="outline"
              onClick={() => processBatch(25)}
              disabled={isProcessingBatch}
            >
              <Play className={`h-4 w-4 mr-2 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              Process Batch (25)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Email Queue Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Queue</CardTitle>
          <CardDescription>
            Latest email queue items and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingQueue ? (
            <div className="text-center py-8 text-muted-foreground">Loading email queue...</div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No emails in queue</div>
          ) : (
            <div className="space-y-2">
              {queueItems.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium">{item.subject}</div>
                      <div className="text-sm text-muted-foreground">
                        To: {item.recipient_email}
                        {item.retry_count && item.retry_count > 0 && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Retry {item.retry_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.status === 'sent' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}>
                      {item.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};