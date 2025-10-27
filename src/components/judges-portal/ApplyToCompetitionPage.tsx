import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useJudgeProfile } from '@/hooks/judges-portal/useJudgeProfile';
import { useJudgeApplications } from '@/hooks/judges-portal/useJudgeApplications';
import { format } from 'date-fns';

export const ApplyToCompetitionPage = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const { judgeProfile } = useJudgeProfile();
  const { applyToCompetition, isApplying } = useJudgeApplications(judgeProfile?.id);
  
  const [availabilityNotes, setAvailabilityNotes] = useState('');

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition-details', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('id', competitionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!judgeProfile || !competitionId) return;

    applyToCompetition({
      judgeId: judgeProfile.id,
      competitionId,
      availabilityNotes: availabilityNotes.trim() || undefined
    }, {
      onSuccess: () => {
        navigate('/judges-portal/applications');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!competition || !judgeProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p>Unable to load application form</p>
          <Button onClick={() => navigate('/judges-portal/competitions')} className="mt-4">
            Back to Competitions
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate(`/judges-portal/competitions/${competitionId}`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Competition
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Apply to Judge</h1>

        {/* Competition Summary */}
        <div className="bg-muted p-4 rounded-lg mb-6">
          <h2 className="font-semibold mb-2">{competition.name}</h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(competition.start_date), 'MMM d, yyyy')} - {' '}
            {format(new Date(competition.end_date), 'MMM d, yyyy')}
          </p>
          <p className="text-sm text-muted-foreground">{competition.location}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Judge Info */}
          <div>
            <h3 className="font-semibold mb-3">Your Information</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Name:</span> {judgeProfile.name}</p>
              {judgeProfile.email && (
                <p><span className="font-medium">Email:</span> {judgeProfile.email}</p>
              )}
              {judgeProfile.phone && (
                <p><span className="font-medium">Phone:</span> {judgeProfile.phone}</p>
              )}
            </div>
          </div>

          {/* Availability Notes */}
          <div className="space-y-2">
            <Label htmlFor="availability">Availability & Notes (Optional)</Label>
            <Textarea
              id="availability"
              placeholder="e.g., Available all day Saturday, prefer morning events, have experience judging drill..."
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
              rows={5}
            />
            <p className="text-sm text-muted-foreground">
              Let the competition organizers know about your availability and any relevant experience
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/judges-portal/competitions/${competitionId}`)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isApplying}>
              {isApplying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
