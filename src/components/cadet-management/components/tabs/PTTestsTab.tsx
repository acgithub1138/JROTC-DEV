import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCadetPTTests } from '@/hooks/useCadetRecords';

interface PTTestsTabProps {
  cadetId: string;
}

export const PTTestsTab: React.FC<PTTestsTabProps> = ({ cadetId }) => {
  const { data: ptTests = [], isLoading } = useCadetPTTests(cadetId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PT Test Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading PT test records...</div>
        </CardContent>
      </Card>
    );
  }

  if (ptTests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PT Test Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No PT test records found for this cadet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PT Test Records ({ptTests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ptTests.map((test) => (
            <div key={test.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  {format(new Date(test.date), 'PPP')}
                </h4>
                <Badge variant="outline">
                  {format(new Date(test.date), 'yyyy')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Push-ups:</span>
                  <div className="font-semibold">{test.push_ups || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Sit-ups:</span>
                  <div className="font-semibold">{test.sit_ups || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Plank:</span>
                  <div className="font-semibold">{formatTime(test.plank_time)}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Mile Run:</span>
                  <div className="font-semibold">{formatTime(test.mile_time)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};