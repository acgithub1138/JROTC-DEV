
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export const EmailLogsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Email Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Email logs and analytics will be implemented in the next phase. 
          This will show detailed email delivery statistics and events.
        </p>
      </CardContent>
    </Card>
  );
};
