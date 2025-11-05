import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const RegisteredSchoolsWidget = () => {
  const { userProfile } = useAuth();

  const { data: schoolStats } = useQuery({
    queryKey: ['registered-schools-stats', userProfile?.school_id],
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
        return { total: 0, paid: 0, unpaid: 0 };
      }

      // Get registered schools
      const { data: schools, error: schoolsError } = await supabase
        .from('cp_comp_schools')
        .select('id, paid')
        .in('competition_id', compIds);

      if (schoolsError) throw schoolsError;

      const total = schools?.length || 0;
      const paid = schools?.filter(s => s.paid).length || 0;
      const unpaid = total - paid;

      return { total, paid, unpaid };
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Registered Schools</CardTitle>
        <Users className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{schoolStats?.total ?? 0}</div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="text-green-600">Paid: {schoolStats?.paid ?? 0}</span>
          <span className="text-orange-600">Unpaid: {schoolStats?.unpaid ?? 0}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Active competitions</p>
      </CardContent>
    </Card>
  );
};
