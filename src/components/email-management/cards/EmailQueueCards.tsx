import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Eye, Users } from 'lucide-react';
import { EmailQueueItem } from '@/hooks/email/useEmailQueue';
import { format } from 'date-fns';

interface EmailQueueCardsProps {
  items: EmailQueueItem[];
  onViewEmail: (item: EmailQueueItem) => void;
}

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

export const EmailQueueCards: React.FC<EmailQueueCardsProps> = ({ items, onViewEmail }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No emails in queue
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const recipients = item.recipient_email.split(',').map(email => email.trim());
        const hasMultiple = recipients.length > 1;

        return (
          <Card key={item.id} className="w-full">
            <CardHeader className="pb-3 px-4 pt-4">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-base truncate flex-1">{item.subject}</CardTitle>
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Recipient:</span>
                  <div className="mt-1">
                    {hasMultiple ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Multiple ({recipients.length})
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Recipients ({recipients.length})</h4>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {recipients.map((email, index) => (
                                <div key={index} className="text-xs p-2 bg-muted rounded border">
                                  {email}
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <p className="font-medium">{item.recipient_email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground">Source:</span>
                  <p className="font-medium">{item.email_templates?.name || 'Manual'}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">Scheduled:</span>
                  <p className="font-medium">
                    {format(new Date(item.scheduled_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                  {item.sent_at && (
                    <p className="text-green-600 text-xs mt-1">
                      Sent: {format(new Date(item.sent_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>

                {item.error_message && (
                  <div>
                    <span className="text-muted-foreground">Error:</span>
                    <p className="text-red-600 text-xs mt-1">{item.error_message}</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full"
                  onClick={() => onViewEmail(item)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Email
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
