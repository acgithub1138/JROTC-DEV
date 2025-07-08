import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
interface ProfileCompetitionsTabProps {
  profileId: string;
}
interface CompetitionEvent {
  id: string;
  event: string;
  competition: {
    id: string;
    name: string;
    competition_date: string;
  };
}
export const ProfileCompetitionsTab = ({
  profileId
}: ProfileCompetitionsTabProps) => {
  const {
    data: competitions = [],
    isLoading
  } = useQuery({
    queryKey: ['profile-competitions', profileId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('competition_events').select(`
          id,
          event,
          competition:competitions(
            id,
            name,
            competition_date
          )
        `).eq('cadet_id', profileId).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching competitions:', error);
        throw error;
      }

      // Filter to unique events
      const uniqueEvents = new Map();
      data?.forEach(item => {
        const key = `${item.competition.name}-${item.event}`;
        if (!uniqueEvents.has(key)) {
          uniqueEvents.set(key, item);
        }
      });
      return Array.from(uniqueEvents.values()) as CompetitionEvent[];
    }
  });
  const formatEventType = (event: string) => {
    return event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  if (isLoading) {
    return <Card className="h-full flex flex-col">
        <CardContent className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded"></div>)}
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Competition History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {competitions.length === 0 ? <div className="text-center py-8 text-muted-foreground">
            <p>No competition participation recorded</p>
          </div> : <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competition</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions.map(comp => <TableRow key={comp.id}>
                    <TableCell>
                      {comp.competition.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatEventType(comp.event)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(comp.competition.competition_date), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </CardContent>
    </Card>;
};