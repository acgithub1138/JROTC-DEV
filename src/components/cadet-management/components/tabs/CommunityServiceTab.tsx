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
        <div className="space-y-4">
          {communityService.map((service) => (
            <div key={service.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{service.event}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(service.date), 'PPP')}
                  </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.hours} hrs
                </Badge>
              </div>
              
              {service.notes && (
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Notes:</span>
                  <div className="mt-1 text-foreground">{service.notes}</div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Recorded on {format(new Date(service.created_at), 'PPp')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};