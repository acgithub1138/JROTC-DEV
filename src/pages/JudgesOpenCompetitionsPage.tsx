import { Trophy, Calendar, MapPin, Building2, Search } from 'lucide-react';
import { useAvailableCompetitions } from '@/hooks/judges-portal/useAvailableCompetitions';
import { useJudgeApplications } from '@/hooks/judges-portal/useJudgeApplications';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
export const JudgesOpenCompetitionsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const {
    competitions,
    isLoading,
    error
  } = useAvailableCompetitions();
  const [judgeId, setJudgeId] = useState<string | undefined>();
  const {
    applications,
    applyToCompetition,
    isApplying
  } = useJudgeApplications(judgeId);

  // Get judge ID
  useState(() => {
    supabase.auth.getUser().then(({
      data
    }) => {
      if (data.user) {
        supabase.from('cp_judges').select('id').eq('user_id', data.user.id).maybeSingle().then(({
          data: judge
        }) => {
          if (judge) setJudgeId(judge.id);
        });
      }
    });
  });
  const isAlreadyApplied = (competitionId: string) => {
    return applications.some(app => app.competition_id === competitionId);
  };
  const getApplicationStatus = (competitionId: string) => {
    const application = applications.find(app => app.competition_id === competitionId);
    return application?.status;
  };
  const handleApply = (competitionId: string) => {
    navigate(`/app/judges-portal/competitions/${competitionId}/apply`);
  };
  const handleViewDetails = (competitionId: string) => {
    navigate(`/app/judges-portal/competitions/${competitionId}`);
  };
  const filteredCompetitions = competitions.filter(comp => {
    const searchLower = searchTerm.toLowerCase();
    return comp.name.toLowerCase().includes(searchLower) || comp.location.toLowerCase().includes(searchLower) || (comp.hosting_school?.toLowerCase() || '').includes(searchLower) || format(new Date(comp.start_date), 'MMM d, yyyy').toLowerCase().includes(searchLower) || format(new Date(comp.end_date), 'MMM d, yyyy').toLowerCase().includes(searchLower);
  });
  if (isLoading) {
    return <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-judge border-t-transparent rounded-full" />
          </div>
        </div>
      </div>;
  }
  if (error) {
    return <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Error loading competitions. Please try again.</p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-judge/5 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-judge to-judge/50 rounded-lg blur opacity-20" />
          <div className="relative bg-background/80 backdrop-blur-sm border border-judge/20 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-lg shadow-judge/20">
                <Trophy className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-4xl">
                  Open Competitions
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Browse and register for available competitions
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search by name, location, school, or date..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12 border-judge/20 focus-visible:ring-judge shadow-sm" />
        </div>

        {filteredCompetitions.length === 0 ? <div className="rounded-xl border-2 border-dashed border-judge/30 bg-card/50 backdrop-blur-sm p-12 text-center">
            <Trophy className="h-20 w-20 mx-auto text-judge/50 mb-6" />
            <h3 className="text-2xl font-bold mb-2">
              {searchTerm ? 'No Matching Competitions' : 'No Open Competitions'}
            </h3>
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'Try adjusting your search criteria' : 'Check back later for new competition opportunities'}
            </p>
          </div> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompetitions.map(competition => {
          const applied = isAlreadyApplied(competition.id);
          const status = getApplicationStatus(competition.id);
          return <Card key={competition.id} className="flex flex-col border-judge/20 hover:border-judge/40 transition-all duration-300 hover:shadow-lg hover:shadow-judge/10 hover:scale-[1.02] bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{competition.name}</CardTitle>
                        {competition.description && <CardDescription className="line-clamp-2 mt-1">
                            {competition.description}
                          </CardDescription>}
                      </div>
                      <div className="flex gap-2">
                        {(competition as any).program && <Badge variant="secondary" className="ml-2 text-white whitespace-nowrap" style={{
                    backgroundColor: (competition as any).program === 'air_force' ? '#003f87' : (competition as any).program === 'army' ? '#454B1B' : (competition as any).program === 'navy' ? '#000080' : (competition as any).program === 'marine_corps' ? '#940000' : undefined
                  }}>
                            <Trophy className="w-3 h-3 mr-1" />
                            {(competition as any).program?.replace("_", " ").toUpperCase() || "N/A"}
                          </Badge>}
                        {applied && <Badge variant={status === 'approved' ? 'default' : 'secondary'}>
                            {status}
                          </Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    {competition.hosting_school && <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{competition.hosting_school}</span>
                      </div>}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(competition.start_date), 'MMM d')} - {format(new Date(competition.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span>Judges: {competition.judges_approved}/{competition.judges_needed}</span>
                    </div>
                    {competition.registration_deadline && <div className="text-sm text-muted-foreground">
                        Register by: {format(new Date(competition.registration_deadline), 'MMM d, yyyy')}
                      </div>}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => handleViewDetails(competition.id)} className="flex-1">
                      View Details
                    </Button>
                    {(!applied || status === 'withdrawn') && <Button onClick={() => handleApply(competition.id)} disabled={isApplying} className="flex-1">
                        {isApplying ? 'Applying...' : status === 'withdrawn' ? 'Reapply' : 'Apply'}
                      </Button>}
                  </CardFooter>
                </Card>;
        })}
          </div>}
      </div>
    </div>;
};