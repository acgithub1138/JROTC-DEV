import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
interface PTTest {
  id: string;
  date: string;
  push_ups: number | null;
  sit_ups: number | null;
  plank_time: number | null; // in seconds
  mile_time: number | null; // in seconds
  created_at: string;
}
interface ProfilePTTestsTabProps {
  profileId: string;
}
export const ProfilePTTestsTab = ({
  profileId
}: ProfilePTTestsTabProps) => {
  const {
    timezone
  } = useSchoolTimezone();
  const {
    data: ptTests = [],
    isLoading
  } = useQuery({
    queryKey: ['pt-tests', profileId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('pt_tests').select('*').eq('cadet_id', profileId).order('date', {
        ascending: false
      });
      if (error) throw error;
      return data as PTTest[];
    }
  });
  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  if (isLoading) {
    return <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
        </div>
      </div>;
  }
  if (ptTests.length === 0) {
    return <div className="p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No PT Tests Recorded</p>
            <p className="text-sm text-muted-foreground">PT test results will appear here once recorded.</p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Push-ups</TableHead>
            <TableHead>Sit-ups</TableHead>
            <TableHead>Plank Time</TableHead>
            <TableHead>Mile Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ptTests.map(test => <TableRow key={test.id}>
              <TableCell className="font-medium py-[6px]">
                {formatTimeForDisplay(test.date, TIME_FORMATS.DATE_ONLY, timezone)}
              </TableCell>
              <TableCell>{test.push_ups || '-'}</TableCell>
              <TableCell>{test.sit_ups || '-'}</TableCell>
              <TableCell>{formatTime(test.plank_time)}</TableCell>
              <TableCell>{formatTime(test.mile_time)}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};