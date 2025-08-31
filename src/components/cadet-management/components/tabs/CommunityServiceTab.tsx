import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useCadetCommunityService } from '@/hooks/useCadetRecords';

interface CommunityServiceTabProps {
  cadetId: string;
}

export const CommunityServiceTab: React.FC<CommunityServiceTabProps> = ({ cadetId }) => {
  const { data: communityService = [], isLoading } = useCadetCommunityService(cadetId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Service Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading community service records...</div>
        </CardContent>
      </Card>
    );
  }

  if (communityService.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Service Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No community service records found for this cadet.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total hours
  const totalHours = communityService.reduce((sum, service) => sum + (service.hours || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Community Service Records ({communityService.length})</span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{totalHours} total hours</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-left p-3 font-semibold">Event</th>
                <th className="text-left p-3 font-semibold">Hours</th>
                <th className="text-left p-3 font-semibold">Notes</th>
                <th className="text-left p-3 font-semibold">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {communityService.map((service) => (
                <tr key={service.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">
                    {format(new Date(service.date), 'PPP')}
                  </td>
                  <td className="p-3">{service.event}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Clock className="h-3 w-3" />
                      {service.hours} hrs
                    </Badge>
                  </td>
                  <td className="p-3 max-w-xs">
                    {service.notes || 'No notes'}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {format(new Date(service.created_at), 'PP')}
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