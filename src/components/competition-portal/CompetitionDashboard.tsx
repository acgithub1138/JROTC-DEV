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
    staleTime: 10 * 60 * 1000,
    // Cache for 10 minutes
    refetchOnWindowFocus: false
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
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8 space-y-8">
      {/* Enhanced Header */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-lg blur opacity-20" />
        <div className="relative bg-background/80 backdrop-blur-sm border border-primary/20 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Competition Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-14">
            Overview of competition activities and performance metrics
          </p>
        </div>
      </div>

      {/* Stats Grid with Enhanced Cards */}
      

      {/* Active Competition Widgets Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <h2 className="text-2xl font-bold text-foreground">Active Competitions Overview</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="transition-all duration-300 hover:scale-[1.02]">
            <RegisteredSchoolsWidget />
          </div>
          <div className="transition-all duration-300 hover:scale-[1.02]">
            <EventsJudgesWidget />
          </div>
          <div className="transition-all duration-300 hover:scale-[1.02]">
            <JudgesStatusWidget />
          </div>
          <div className="transition-all duration-300 hover:scale-[1.02]">
            <ScoreSheetsWidget />
          </div>
        </div>
      </div>
    </div>;
};
export default CompetitionDashboard;