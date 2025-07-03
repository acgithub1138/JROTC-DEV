
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Activity, Mail, AlertCircle, CheckCircle, MousePointer, Eye } from 'lucide-react';
import { useEmailLogs } from '@/hooks/email/useEmailLogs';
import { format } from 'date-fns';

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'queued':
      return <Mail className="w-4 h-4" />;
    case 'sent':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'opened':
      return <Eye className="w-4 h-4 text-blue-600" />;
    case 'clicked':
      return <MousePointer className="w-4 h-4 text-purple-600" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'queued':
      return 'bg-blue-100 text-blue-800';
    case 'sent':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'opened':
      return 'bg-indigo-100 text-indigo-800';
    case 'clicked':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const EmailLogsTab: React.FC = () => {
  const { logs, isLoading } = useEmailLogs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Email Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading email logs...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Email Logs
          <Badge variant="secondary" className="ml-2">
            {logs.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email activity</h3>
            <p className="text-muted-foreground">
              Email events and activity logs will appear here once emails are processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        {getEventIcon(log.event_type)}
                        <Badge className={getEventColor(log.event_type)}>
                          {log.event_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {log.email_queue.recipient_email}
                    </TableCell>
                    <TableCell className="max-w-xs truncate py-2">
                      {log.email_queue.subject}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm py-2">
                      {log.event_data && Object.keys(log.event_data).length > 0 && (
                        <div className="max-w-xs">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {JSON.stringify(log.event_data, null, 1).slice(0, 50)}
                            {JSON.stringify(log.event_data).length > 50 && '...'}
                          </code>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
