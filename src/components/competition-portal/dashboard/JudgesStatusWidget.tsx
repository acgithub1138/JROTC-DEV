import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const JudgesStatusWidget = () => {
  const { userProfile } = useAuth();

  const { data: judgeStats } = useQuery({
    queryKey: ['judges-status-stats', userProfile?.school_id],
    enabled: !!userProfile?.school_id,
    queryFn: async () => {
      const schoolId = userProfile!.school_id as string;

      // Get active competitions
      const { data: comps, error: compsError } = await supabase
        .from('cp_competitions')
        .select('id')
        .eq('school_id', schoolId)
        .eq('status', 'open');

      if (compsError) throw compsError;

      const compIds = comps?.map(c => c.id) || [];
      if (compIds.length === 0) {
        return { total: 0, approved: 0, pending: 0 };
      }

      // Get judge assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('cp_comp_judges')
        .select(`
          id,
          judge:cp_judges!inner(available)
        `)
        .in('competition_id', compIds);

      if (assignmentsError) throw assignmentsError;

      const total = assignments?.length || 0;
      const approved = assignments?.filter((a: any) => a.judge?.available === true).length || 0;
      const pending = total - approved;

      return { total, approved, pending };
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Judge Assignments</CardTitle>
        <UserCheck className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{judgeStats?.total ?? 0}</div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="text-green-600">Approved: {judgeStats?.approved ?? 0}</span>
          <span className="text-orange-600">Pending: {judgeStats?.pending ?? 0}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Active competitions</p>
      </CardContent>
    </Card>
  );
};
