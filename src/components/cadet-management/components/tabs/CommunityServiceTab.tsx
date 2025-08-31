import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useCadetCommunityService } from '@/hooks/useCadetRecords';
interface CommunityServiceTabProps {
  cadetId: string;
}
export const CommunityServiceTab: React.FC<CommunityServiceTabProps> = ({
  cadetId
}) => {
  const {
    data: communityService = [],
    isLoading
  } = useCadetCommunityService(cadetId);
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Community Service Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading community service records...</div>
        </CardContent>
      </Card>;
  }
  if (communityService.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>Community Service Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No community service records found for this cadet.
          </div>
        </CardContent>
      </Card>;
  }

  // Calculate total hours
  const totalHours = communityService.reduce((sum, service) => sum + (service.hours || 0), 0);
  return <Card>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Date</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Event</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Hours</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Notes</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {communityService.map(service => <tr key={service.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium px-[8px] py-[8px]">
                    {format(new Date(service.date), 'PPP')}
                  </td>
                  <td className="p-3 px-[8px] py-[8px]">{service.event}</td>
                  <td className="p-3 px-[8px] py-[8px]">
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Clock className="h-3 w-3" />
                      {service.hours} hrs
                    </Badge>
                  </td>
                  <td className="p-3 max-w-xs px-[8px] py-[8px]">
                    {service.notes || 'No notes'}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground px-[8px] py-[8px]">
                    {format(new Date(service.created_at), 'PP')}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>;
};