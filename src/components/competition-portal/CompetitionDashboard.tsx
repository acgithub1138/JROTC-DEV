import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Users, Target, TrendingUp, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RegisteredSchoolsWidget } from './dashboard/RegisteredSchoolsWidget';
import { EventsJudgesWidget } from './dashboard/EventsJudgesWidget';
import { JudgesStatusWidget } from './dashboard/JudgesStatusWidget';
import { ScoreSheetsWidget } from './dashboard/ScoreSheetsWidget';
const CompetitionDashboard = () => {
  const {
    userProfile
  } = useAuth();
  const {
    data: stats
  } = useQuery({
    queryKey: ['competition-dashboard-stats', userProfile?.school_id],
    enabled: !!userProfile?.school_id,
    queryFn: async () => {
      const schoolId = userProfile!.school_id as string;
      const nowISO = new Date().toISOString();
      const thirtyDaysISO = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const [compsRes, eventsRes] = await Promise.all([supabase.from('cp_competitions').select('id,status').eq('school_id', schoolId), supabase.from('cp_comp_events').select('id,start_time').eq('school_id', schoolId).gte('start_time', nowISO).lte('start_time', thirtyDaysISO)]);
      if (compsRes.error) throw compsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      const competitions = compsRes.data || [];
      const compIds = competitions.map((c: any) => c.id);
      const activeCompetitions = competitions.filter((c: any) => c.status === 'open').length;
      const upcomingEvents = (eventsRes.data || []).length;
      let participatingTeams = 0;
      let entries = 0;
      if (compIds.length > 0) {
        const [teamsRes, regsRes] = await Promise.all([supabase.from('cp_comp_schools').select('id').in('competition_id', compIds), supabase.from('cp_event_registrations').select('id').in('competition_id', compIds)]);
        if (teamsRes.error) throw teamsRes.error;
        if (regsRes.error) throw regsRes.error;
        participatingTeams = teamsRes.data?.length || 0;
        entries = regsRes.data?.length || 0;
      }
      let avgScore = 0;
      let awards = 0;
      const resultsRes = await supabase.from('competition_results').select('score, placement, school_id').eq('school_id', schoolId);
      if (!resultsRes.error && resultsRes.data) {
        const scores = resultsRes.data.map((r: any) => Number(r.score)).filter((n: number) => !isNaN(n));
        if (scores.length) avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        awards = resultsRes.data.filter((r: any) => r.placement !== null).length;
      }
      return {
        activeCompetitions,
        upcomingEvents,
        participatingTeams,
        totalParticipants: entries,
        averageScore: avgScore,
        awardsGiven: awards
      };
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });
  const dashboardStats = [{
    title: 'Active Competitions',
    value: String(stats?.activeCompetitions ?? 0),
    description: 'Open for registration',
    icon: Trophy,
    color: 'text-yellow-500'
  }, {
    title: 'Total Participants',
    value: String(stats?.totalParticipants ?? 0),
    description: 'Event registrations',
    icon: Target,
    color: 'text-purple-500'
  }];
  return <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Competition Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of competition activities and performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardStats.map((stat, index) => <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>)}
      </div>

      {/* Active Competition Widgets */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Competitions Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <RegisteredSchoolsWidget />
          <EventsJudgesWidget />
          <JudgesStatusWidget />
          <ScoreSheetsWidget />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        

        
      </div>
    </div>;
};
export default CompetitionDashboard;