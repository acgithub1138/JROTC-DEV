import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
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
    <Card className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">Judges Status</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
          <Users className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
          {judgeStats?.total ?? 0}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{judgeStats?.approved ?? 0} Approved</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">{judgeStats?.pending ?? 0} Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
