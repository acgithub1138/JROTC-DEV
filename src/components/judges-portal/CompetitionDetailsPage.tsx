import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Building2, DollarSign, Users, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useJudgeProfile } from '@/hooks/judges-portal/useJudgeProfile';
import { useJudgeApplications } from '@/hooks/judges-portal/useJudgeApplications';

export const CompetitionDetailsPage = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const { judgeProfile } = useJudgeProfile();
  const { applications } = useJudgeApplications(judgeProfile?.id);

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition-details', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select(`
          *,
          cp_comp_events (
            id,
            event,
            competition_event_types (
              name
            )
          )
        `)
        .eq('id', competitionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId
  });

  const applicationStatus = applications?.find(app => app.competition_id === competitionId)?.status;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p>Competition not found</p>
          <Button onClick={() => navigate('/judges-portal/competitions')} className="mt-4">
            Back to Competitions
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Application Pending' },
      approved: { variant: 'default', label: 'Approved' },
      declined: { variant: 'destructive', label: 'Declined' },
      withdrawn: { variant: 'outline', label: 'Withdrawn' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant} className="text-base px-4 py-1">{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/judges-portal/competitions')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Competitions
      </Button>

      <div className="grid gap-6">
        {/* Header Card */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{competition.name}</h1>
              {applicationStatus && getStatusBadge(applicationStatus)}
            </div>
            
            {!applicationStatus && judgeProfile && (
              <Button
                size="lg"
                onClick={() => navigate(`/judges-portal/competitions/${competitionId}/apply`)}
              >
                Apply to Judge
              </Button>
            )}
          </div>

          {competition.description && (
            <p className="text-muted-foreground mb-6">{competition.description}</p>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Competition Dates</p>
                <p className="font-medium">
                  {format(new Date(competition.start_date), 'MMM d, yyyy')} - {' '}
                  {format(new Date(competition.end_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{competition.location}</p>
                {(competition.address || competition.city) && (
                  <p className="text-sm text-muted-foreground">
                    {competition.address && `${competition.address}, `}
                    {competition.city && competition.city}
                    {competition.state && `, ${competition.state}`}
                  </p>
                )}
              </div>
            </div>

            {competition.hosting_school && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Hosting School</p>
                  <p className="font-medium">{competition.hosting_school}</p>
                </div>
              </div>
            )}

            {competition.registration_deadline && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Registration Deadline</p>
                  <p className="font-medium">
                    {format(new Date(competition.registration_deadline), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Events Card */}
        {competition.cp_comp_events && competition.cp_comp_events.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Competition Events
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {competition.cp_comp_events.map((event: any) => (
                <div key={event.id} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    {event.competition_event_types?.name || 'Unknown Event'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* SOP Information */}
        {(competition.sop_text || competition.sop_link) && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Standard Operating Procedures</h2>
            {competition.sop_text && (
              <div className="prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: competition.sop_text }} />
            )}
            {competition.sop_link && (
              <Button variant="outline" asChild>
                <a href={competition.sop_link} target="_blank" rel="noopener noreferrer">
                  View SOP Document
                </a>
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
