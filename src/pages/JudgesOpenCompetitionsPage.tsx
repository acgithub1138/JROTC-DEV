import { Trophy, Calendar, MapPin, Building2 } from 'lucide-react';
import { useAvailableCompetitions } from '@/hooks/judges-portal/useAvailableCompetitions';
import { useJudgeApplications } from '@/hooks/judges-portal/useJudgeApplications';
import { useJudgeProfile } from '@/hooks/judges-portal/useJudgeProfile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const JudgesOpenCompetitionsPage = () => {
  const navigate = useNavigate();
  const { competitions, isLoading, error } = useAvailableCompetitions();
  const { judgeProfile } = useJudgeProfile();
  const { applications, applyToCompetition, isApplying } = useJudgeApplications(judgeProfile?.id);

  const isAlreadyApplied = (competitionId: string) => {
    return applications.some(app => app.competition_id === competitionId);
  };

  const getApplicationStatus = (competitionId: string) => {
    const application = applications.find(app => app.competition_id === competitionId);
    return application?.status;
  };

  const handleApply = async (competitionId: string) => {
    if (!judgeProfile?.id) return;
    await applyToCompetition({
      judgeId: judgeProfile.id,
      competitionId,
      availabilityNotes: ''
    });
  };

  const handleViewDetails = (competitionId: string) => {
    navigate(`/app/judges-portal/competitions/${competitionId}`);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-judge border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Error loading competitions. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Open Competitions</h1>
            <p className="text-muted-foreground mt-1">
              Browse and register for available competitions
            </p>
          </div>
        </div>

        {competitions.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto text-judge/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Open Competitions</h3>
            <p className="text-muted-foreground">
              Check back later for new competition opportunities
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {competitions.map((competition) => {
              const applied = isAlreadyApplied(competition.id);
              const status = getApplicationStatus(competition.id);
              
              return (
                <Card key={competition.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl">{competition.name}</CardTitle>
                      {applied && (
                        <Badge variant={status === 'approved' ? 'default' : 'secondary'}>
                          {status}
                        </Badge>
                      )}
                    </div>
                    {competition.description && (
                      <CardDescription className="line-clamp-2">
                        {competition.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
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
                    {competition.hosting_school && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{competition.hosting_school}</span>
                      </div>
                    )}
                    {competition.registration_deadline && (
                      <div className="text-sm text-muted-foreground">
                        Register by: {format(new Date(competition.registration_deadline), 'MMM d, yyyy')}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(competition.id)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    {!applied && (
                      <Button
                        onClick={() => handleApply(competition.id)}
                        disabled={isApplying}
                        className="flex-1"
                      >
                        {isApplying ? 'Applying...' : 'Apply'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
