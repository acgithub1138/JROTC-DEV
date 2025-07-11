
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Activity, Mail, AlertCircle, CheckCircle, MousePointer, Eye, Edit, Trash2 } from 'lucide-react';
import { useEmailLogs } from '@/hooks/email/useEmailLogs';
import { useEmailPermissions } from '@/hooks/useModuleSpecificPermissions';
import { EmailViewDialog } from '../dialogs/EmailViewDialog';
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
  const { canViewDetails, canUpdate, canDelete } = useEmailPermissions();
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

  const handleDeleteLog = (logId: string) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      console.log('Delete log:', logId);
      // TODO: Implement delete log functionality
    }
  };

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
    <>
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
                    <TableHead>Actions</TableHead>
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
                      <TableCell className="py-2">
                        <div className="flex gap-2">
                          {canViewDetails && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEmail(log.email_queue)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {canUpdate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEmail(log.email_queue)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLog(log.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
