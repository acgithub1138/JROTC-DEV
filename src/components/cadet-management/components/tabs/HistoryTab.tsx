import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, User, FileText } from 'lucide-react';
import { useCadetHistory } from '@/hooks/useCadetRecords';

interface HistoryTabProps {
  cadetId: string;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ cadetId }) => {
  const { data: history = [], isLoading } = useCadetHistory(cadetId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cadet History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading cadet history...</div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Cadet History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No history records found for this cadet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'profile created':
      case 'profile updated':
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'profile created':
        return 'default';
      case 'profile updated':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Cadet History ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex gap-3">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getTypeIcon(entry.type)}
                </div>
                {index < history.length - 1 && (
                  <div className="mt-2 h-8 w-0.5 bg-border"></div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 space-y-2 pb-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{entry.description}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeBadgeVariant(entry.type)}>
                      {entry.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.date), 'PPp')}
                    </span>
                  </div>
                </div>
                
                {entry.details && (
                  <div className="text-sm text-muted-foreground">
                    {entry.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};