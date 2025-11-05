import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
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
    <Card className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">Registered Schools</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
          <Building className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
          {schoolStats?.total ?? 0}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{schoolStats?.paid ?? 0} Paid</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">{schoolStats?.unpaid ?? 0} Unpaid</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
