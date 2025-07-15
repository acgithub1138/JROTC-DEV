import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Timer, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export const ProfilePTTestsTab = ({ profileId }: ProfilePTTestsTabProps) => {
  const { data: ptTests = [], isLoading } = useQuery({
    queryKey: ['pt-tests', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pt_tests')
        .select('*')
        .eq('cadet_id', profileId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as PTTest[];
    },
  });

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (ptTests.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No PT Tests Recorded</p>
            <p className="text-sm text-muted-foreground">PT test results will appear here once recorded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {ptTests.map((test) => (
        <Card key={test.id} className="animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(test.date).toLocaleDateString()}
              </CardTitle>
              <Badge variant="outline">
                {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {test.push_ups || '-'}
                </p>
                <p className="text-sm text-muted-foreground">Push-ups</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {test.sit_ups || '-'}
                </p>
                <p className="text-sm text-muted-foreground">Sit-ups</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                  <Timer className="h-4 w-4" />
                  {formatTime(test.plank_time)}
                </p>
                <p className="text-sm text-muted-foreground">Plank</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                  <Timer className="h-4 w-4" />
                  {formatTime(test.mile_time)}
                </p>
                <p className="text-sm text-muted-foreground">Mile Run</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};