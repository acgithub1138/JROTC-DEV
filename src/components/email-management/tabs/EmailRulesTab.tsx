
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export const EmailRulesTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Email Rules
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Email rules functionality will be implemented in the next phase. 
          This will allow you to configure when emails are automatically sent based on database events.
        </p>
      </CardContent>
    </Card>
  );
};
