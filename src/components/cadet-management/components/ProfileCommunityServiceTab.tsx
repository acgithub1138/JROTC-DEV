import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
interface ProfileCommunityServiceTabProps {
  profileId: string;
}
interface CommunityServiceRecord {
  id: string;
  event: string;
  date: string;
  hours: number | null;
  notes: string | null;
  created_at: string;
}
export const ProfileCommunityServiceTab = ({
  profileId
}: ProfileCommunityServiceTabProps) => {
  const {
    timezone
  } = useSchoolTimezone();
  const {
    data: communityService = [],
    isLoading
  } = useQuery({
    queryKey: ['profile-community-service', profileId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('community_service').select('id, event, date, hours, notes, created_at').eq('cadet_id', profileId).order('date', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching community service:', error);
        throw error;
      }
      return data as CommunityServiceRecord[];
    }
  });
  if (isLoading) {
    return <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded"></div>)}
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="h-full flex flex-col">
      
      <CardContent className="flex-1 overflow-hidden">
        {communityService.length === 0 ? <div className="text-center py-8 text-muted-foreground">
            <p>No community service records found</p>
          </div> : <div className="h-full overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communityService.map(record => <TableRow key={record.id}>
                    <TableCell>{record.event}</TableCell>
                    <TableCell className="py-[6px]">
                      {formatTimeForDisplay(record.date, TIME_FORMATS.DATE_ONLY, timezone)}
                    </TableCell>
                    <TableCell>
                      {record.hours !== null ? <Badge variant="outline">
                          {record.hours}h
                        </Badge> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {record.notes || '-'}
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </CardContent>
    </Card>;
};