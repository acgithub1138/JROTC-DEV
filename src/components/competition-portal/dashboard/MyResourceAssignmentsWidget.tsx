import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, MapPin, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI } from '@/utils/timezoneUtils';

interface ResourceAssignment {
  id: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  assignment_details: string | null;
}

export const MyResourceAssignmentsWidget = () => {
  const { userProfile } = useAuth();
  const { timezone } = useSchoolTimezone();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-resource-assignments', userProfile?.id, userProfile?.school_id],
    enabled: !!userProfile?.id && !!userProfile?.school_id,
    queryFn: async () => {
      // Get active competitions for this school
      const { data: comps, error: compsError } = await supabase
        .from('cp_competitions')
        .select('id')
        .eq('school_id', userProfile!.school_id as string)
        .eq('status', 'open');

      if (compsError) throw compsError;

      const compIds = comps?.map(c => c.id) || [];
      if (compIds.length === 0) return [];

      // Get resource assignments for current user
      const { data, error } = await supabase
        .from('cp_comp_resources')
        .select('id, location, start_time, end_time, assignment_details')
        .eq('resource', userProfile!.id)
        .in('competition_id', compIds)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as ResourceAssignment[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Don't render if no assignments
  if (!isLoading && (!assignments || assignments.length === 0)) {
    return null;
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return convertToUI(dateStr, timezone, 'time');
  };

  return (
    <Card className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">My Assignments</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
          <ClipboardList className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
          {assignments?.length ?? 0}
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {assignments?.slice(0, 3).map((assignment) => (
            <div key={assignment.id} className="text-xs border-l-2 border-primary/30 pl-2">
              {assignment.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{assignment.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}</span>
              </div>
              {assignment.assignment_details && (
                <div className="text-foreground/80 truncate">{assignment.assignment_details}</div>
              )}
            </div>
          ))}
          {assignments && assignments.length > 3 && (
            <div className="text-xs text-muted-foreground">+{assignments.length - 3} more</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
