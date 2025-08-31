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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-left p-3 font-semibold">Push-ups</th>
                <th className="text-left p-3 font-semibold">Sit-ups</th>
                <th className="text-left p-3 font-semibold">Plank</th>
                <th className="text-left p-3 font-semibold">Mile Run</th>
                <th className="text-left p-3 font-semibold">Year</th>
              </tr>
            </thead>
            <tbody>
              {ptTests.map((test) => (
                <tr key={test.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">
                    {format(new Date(test.date), 'PPP')}
                  </td>
                  <td className="p-3">{test.push_ups || 'N/A'}</td>
                  <td className="p-3">{test.sit_ups || 'N/A'}</td>
                  <td className="p-3">{formatTime(test.plank_time)}</td>
                  <td className="p-3">{formatTime(test.mile_time)}</td>
                  <td className="p-3">
                    <Badge variant="outline">
                      {format(new Date(test.date), 'yyyy')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};