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
  total_points: number | null;
  competition: {
    id: string;
    name: string;
    competition_date: string;
    location: string | null;
  };
}

export const ProfileCompetitionsTab = ({ profileId }: ProfileCompetitionsTabProps) => {
  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['profile-competitions', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_events')
        .select(`
          id,
          event,
          total_points,
          competition:competitions(
            id,
            name,
            competition_date,
            location
          )
        `)
        .eq('cadet_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching competitions:', error);
        throw error;
      }

      return data as CompetitionEvent[];
    },
  });

  const formatEventType = (event: string) => {
    return event
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition History</CardTitle>
      </CardHeader>
      <CardContent>
        {competitions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No competition participation recorded</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competition</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitions.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell className="font-medium">
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
                  <TableCell>{comp.competition.location || '-'}</TableCell>
                  <TableCell>
                    {comp.total_points !== null ? (
                      <Badge className={getScoreColor(comp.total_points)}>
                        {comp.total_points}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};