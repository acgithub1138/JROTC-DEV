
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export const EmailQueueTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Email Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Email queue functionality will be implemented in the next phase. 
          This will show pending, sent, and failed emails.
        </p>
      </CardContent>
    </Card>
  );
};
