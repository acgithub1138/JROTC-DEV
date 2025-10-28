import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { EventScoreForm } from '@/components/competition-management/components/EventScoreForm';
import { useCompetitionTemplates } from '@/components/competition-management/hooks/useCompetitionTemplates';
import { Skeleton } from '@/components/ui/skeleton';

export const EditScoreSheetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scoreSheetId = searchParams.get('id');
  const { templates } = useCompetitionTemplates();

  const [scoreSheet, setScoreSheet] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!scoreSheetId) {
      toast.error('No score sheet ID provided');
      navigate('/app/judges-portal');
      return;
    }

    loadScoreSheet();
  }, [scoreSheetId]);

  const loadScoreSheet = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_events')
        .select('*')
        .eq('id', scoreSheetId)
        .single();

      if (error) throw error;

      setScoreSheet(data);
      const scoreSheetData = data.score_sheet as any;
      setScores(scoreSheetData?.scores || {});
      setTotalPoints(data.total_points || 0);
    } catch (error) {
      console.error('Error loading score sheet:', error);
      toast.error('Failed to load score sheet');
      navigate('/app/judges-portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (newScores: Record<string, any>, newTotal: number) => {
    setScores(newScores);
    setTotalPoints(newTotal);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const scoreSheetData = scoreSheet.score_sheet as any;
      const updatedScoreSheet = {
        ...scoreSheetData,
        scores: scores,
        calculated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('competition_events')
        .update({
          score_sheet: updatedScoreSheet,
          total_points: totalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', scoreSheetId);

      if (error) throw error;

      toast.success('Score sheet updated successfully');
      navigate('/app/judges-portal');
    } catch (error) {
      console.error('Error updating score sheet:', error);
      toast.error('Failed to update score sheet');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const scoreSheetData = scoreSheet?.score_sheet as any;
  const template = templates.find(t => t.id === scoreSheetData?.template_id);
  const judgeNumber = scoreSheetData?.judge_number || 'Unknown Judge';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/app/judges-portal')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Score Sheet</h1>
          <p className="text-sm text-muted-foreground">
            Judge {judgeNumber}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Details</CardTitle>
        </CardHeader>
        <CardContent>
          {template ? (
            <EventScoreForm
              templateScores={template.scores as Record<string, any>}
              onScoreChange={handleScoreChange}
              initialScores={scores}
              judgeNumber={judgeNumber}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Template not found for this score sheet.</p>
              <p className="text-sm mt-2">Unable to edit scores without template data.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/app/judges-portal')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!template || isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
